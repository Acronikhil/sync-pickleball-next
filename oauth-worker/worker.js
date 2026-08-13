/**
 * GitHub OAuth token exchange for the Sync Pickleball admin panel.
 *
 * Why this exists: GitHub Pages has no backend, but the final step of OAuth
 * requires the client *secret*, and GitHub's token endpoint sends no CORS
 * headers — so the browser can neither hold the secret nor call the endpoint.
 * This Worker is the smallest possible piece of server: it takes a one-time
 * code, swaps it for an access token, and returns the token.
 *
 * The secret never leaves the Worker. The token is returned only to origins on
 * the allow-list, so another site cannot use this proxy to mint tokens for
 * your OAuth app.
 *
 * Deploy:
 *   cd oauth-worker
 *   npx wrangler secret put GITHUB_CLIENT_SECRET
 *   npx wrangler deploy
 */

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

    if (!cors) {
      return json({ error: "origin_not_allowed" }, 403, {});
    }

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, cors);
    }

    let code;
    try {
      ({ code } = await request.json());
    } catch {
      return json({ error: "invalid_json" }, 400, cors);
    }

    if (!code) {
      return json({ error: "missing_code" }, 400, cors);
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const payload = await response.json();

    if (payload.error || !payload.access_token) {
      return json(
        {
          error: payload.error ?? "exchange_failed",
          error_description:
            payload.error_description ??
            "GitHub would not exchange that code for a token.",
        },
        400,
        cors
      );
    }

    // Only the token goes back — never the refresh token or scope internals
    // the browser has no use for.
    return json({ access_token: payload.access_token }, 200, cors);
  },
};
