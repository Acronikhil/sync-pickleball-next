/**
 * GitHub OAuth for a site with no backend.
 *
 * The browser can start the OAuth dance itself, but it cannot finish it:
 * GitHub's token endpoint requires the client secret and sends no CORS
 * headers. So the code-for-token swap goes through the Cloudflare Worker in
 * oauth-worker/, which is the only place the secret exists.
 *
 * The token is held in sessionStorage, not localStorage — it disappears when
 * the tab closes, which keeps a repo-write token from sitting on disk
 * indefinitely. Re-login is one click once the OAuth app is authorised.
 */

import { siteConfig } from "@/site.config";

const TOKEN_KEY = "sync-admin-token";
const STATE_KEY = "sync-admin-oauth-state";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function redirectUri(): string {
  return `${window.location.origin}/admin/callback/`;
}

/** True when the OAuth app details have been baked in at build time. */
export function isOAuthConfigured(): boolean {
  return Boolean(siteConfig.oauth.clientId && siteConfig.oauth.proxyUrl);
}

/** Sends the admin to GitHub to authorise. */
export function beginLogin(): void {
  const state = crypto.randomUUID();
  window.sessionStorage.setItem(STATE_KEY, state);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", siteConfig.oauth.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", siteConfig.oauth.scope);
  url.searchParams.set("state", state);

  window.location.href = url.toString();
}

/**
 * Completes login on /admin/callback: verifies the state parameter, then has
 * the worker exchange the code for an access token.
 */
export async function completeLogin(
  code: string,
  state: string
): Promise<void> {
  const expected = window.sessionStorage.getItem(STATE_KEY);
  window.sessionStorage.removeItem(STATE_KEY);

  if (!expected || expected !== state) {
    throw new Error(
      "Login state did not match. Start the login again from the admin page."
    );
  }

  const response = await fetch(siteConfig.oauth.proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        "Could not exchange the login code for a token."
    );
  }

  setToken(payload.access_token);
}
