/**
 * Publish endpoint for the Sync Pickleball admin panel.
 *
 * Sign-in is Google, not GitHub — so unlike a GitHub OAuth token, a Google ID
 * token proves who you are but carries no permission to write to this repo.
 * That permission lives here instead: this Worker holds a GitHub token (a
 * fine-grained personal access token scoped to just this repo) and is the
 * only thing in the whole system that ever uses it.
 *
 * For every publish it:
 *   1. verifies the Google ID token's signature, issuer, audience and expiry
 *   2. checks the verified email against an allow-list
 *   3. only then commits the given files to the repo on the caller's behalf
 *
 * Nothing is stored between requests. There is no session — every publish
 * re-proves identity from scratch.
 *
 * Deploy:
 *   cd oauth-worker
 *   npx wrangler secret put GITHUB_TOKEN
 *   npx wrangler deploy
 */

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

function corsHeaders(origin, allowed) {
  if (!origin || !allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/* ------------------------------- base64url ------------------------------- */

function base64urlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlToJson(value) {
  return JSON.parse(new TextDecoder().decode(base64urlToBytes(value)));
}

/* ----------------------------- Google identity ----------------------------- */

// Google rotates its signing keys infrequently. A short in-memory cache avoids
// a fetch on every publish without risking a stale key for long — and since a
// Worker instance is short-lived anyway, this never goes stale for real.
let cachedJwks = null;
let cachedJwksAt = 0;

async function getGoogleJwks() {
  if (cachedJwks && Date.now() - cachedJwksAt < 10 * 60 * 1000) return cachedJwks;
  const response = await fetch(GOOGLE_JWKS_URL);
  if (!response.ok) throw new Error("Could not fetch Google's signing keys.");
  const { keys } = await response.json();
  cachedJwks = keys;
  cachedJwksAt = Date.now();
  return keys;
}

/**
 * Verifies a Google ID token's signature, issuer, audience and expiry, and
 * returns the verified email. Throws on any failure — nothing here is
 * optional, since this is the one place that stands between the public
 * internet and a token that can write to the repo.
 */
async function verifyGoogleIdToken(idToken, clientId) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token.");
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = base64urlToJson(headerB64);
  const payload = base64urlToJson(payloadB64);

  if (payload.aud !== clientId) {
    throw new Error("Token was issued for a different app.");
  }
  if (!GOOGLE_ISSUERS.has(payload.iss)) {
    throw new Error("Token was not issued by Google.");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new Error("Sign-in has expired. Please sign in again.");
  }
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new Error("That Google account's email is not verified.");
  }

  const keys = await getGoogleJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Could not find a matching Google signing key.");

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlToBytes(signatureB64);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    signedData
  );
  if (!valid) throw new Error("Token signature did not verify.");

  return { email: String(payload.email).toLowerCase() };
}

/* --------------------------------- GitHub --------------------------------- */

async function gh(env, path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sync-pickleball-oauth-worker",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.message || `GitHub API error (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

/**
 * Writes every changed file as a single commit on the deploy branch, using
 * the Git Data API (blobs -> tree -> commit -> ref) so one editing session
 * produces exactly one commit and one deploy, however many files changed.
 *
 * If `baseSha` is given and no longer matches the file's current sha, the
 * commit is refused unless `force` is set — this is the server-side half of
 * the "someone else published while you were editing" check.
 */
async function publish(env, { files, message, baseSha, force }) {
  const owner = env.REPO_OWNER;
  const repo = env.REPO_NAME;
  const branch = env.REPO_BRANCH;
  const base = `/repos/${owner}/${repo}`;

  const current = await gh(env, `${base}/contents/${env.CONTENT_PATH}?ref=${branch}`);
  if (baseSha && current.sha !== baseSha && !force) {
    return { conflict: true, currentSha: current.sha };
  }

  const ref = await gh(env, `${base}/git/ref/heads/${branch}`);
  const headSha = ref.object.sha;
  const headCommit = await gh(env, `${base}/git/commits/${headSha}`);

  const blobs = [];
  for (const file of files) {
    const blob = await gh(env, `${base}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: file.base64, encoding: "base64" }),
    });
    blobs.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const tree = await gh(env, `${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  });

  const commit = await gh(env, `${base}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [headSha] }),
  });

  await gh(env, `${base}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha };
}

/* ---------------------------------- entry ---------------------------------- */

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") {
      return cors
        ? new Response(null, { status: 204, headers: cors })
        : new Response("Origin not allowed", { status: 403 });
    }
    if (!cors) return json({ error: "origin_not_allowed" }, 403, {});

    const url = new URL(request.url);
    if (url.pathname !== "/publish" || request.method !== "POST") {
      return json({ error: "not_found" }, 404, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, cors);
    }

    const { idToken, files, message, baseSha, force } = body;
    if (!idToken || !Array.isArray(files) || files.length === 0 || !message) {
      return json({ error: "missing_fields" }, 400, cors);
    }

    let identity;
    try {
      identity = await verifyGoogleIdToken(idToken, env.GOOGLE_CLIENT_ID);
    } catch (cause) {
      return json(
        { error: "unauthenticated", error_description: cause.message },
        401,
        cors
      );
    }

    const adminEmails = (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0 && !adminEmails.includes(identity.email)) {
      return json(
        {
          error: "forbidden",
          error_description: `${identity.email} is not an allowed editor.`,
        },
        403,
        cors
      );
    }

    try {
      const result = await publish(env, {
        files,
        message,
        baseSha,
        force: Boolean(force),
      });
      if (result.conflict) {
        return json({ error: "conflict", currentSha: result.currentSha }, 409, cors);
      }
      return json({ sha: result.sha }, 200, cors);
    } catch (cause) {
      return json(
        { error: "publish_failed", error_description: cause.message },
        502,
        cors
      );
    }
  },
};
