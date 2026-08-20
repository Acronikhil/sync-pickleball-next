/**
 * Google Sign-In for the admin panel.
 *
 * Unlike the GitHub OAuth token this replaces, a Google ID token proves who
 * you are but carries no permission to write to the repo — that stays with
 * the Cloudflare Worker (see oauth-worker/), which holds a GitHub token and
 * checks the signed-in email against an allow-list before it will commit
 * anything on your behalf. See lib/publish.ts for that call.
 *
 * The ID token is held in sessionStorage — gone when the tab closes — and it
 * expires on its own after about an hour, at which point publishing will ask
 * you to sign in again.
 */

import { siteConfig } from "@/site.config";

const TOKEN_KEY = "sync-admin-id-token";
const GSI_SRC = "https://accounts.google.com/gsi/client";

export interface Identity {
  email: string;
  name: string;
  picture: string;
  /** Unix seconds. */
  exp: number;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

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

/** True once the Google client id and Worker URL are baked in at build time. */
export function isGoogleConfigured(): boolean {
  return Boolean(siteConfig.google.clientId && siteConfig.publishUrl);
}

/**
 * Reads the identity out of an ID token without verifying its signature —
 * fine for display purposes only. Every publish is re-verified server-side by
 * the Worker, so nothing here needs to be trusted.
 */
export function decodeIdentity(idToken: string): Identity | null {
  try {
    const [, payloadB64] = idToken.split(".");
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(padded)) as Record<string, unknown>;
    return {
      email: String(json.email ?? "").toLowerCase(),
      name: typeof json.name === "string" ? json.name : String(json.email ?? ""),
      picture: typeof json.picture === "string" ? json.picture : "",
      exp: typeof json.exp === "number" ? json.exp : 0,
    };
  } catch {
    return null;
  }
}

export function isExpired(identity: Identity): boolean {
  return identity.exp * 1000 < Date.now();
}

let scriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GSI_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Sign-In."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Loads Google Identity Services and renders the official "Sign in with
 * Google" button into `container`. `onToken` fires with the raw ID token once
 * the admin signs in — this all happens in-page, with no redirect.
 */
export async function renderSignInButton(
  container: HTMLElement,
  onToken: (idToken: string) => void
): Promise<void> {
  await loadGsiScript();

  const accounts = window.google?.accounts.id;
  if (!accounts) throw new Error("Google Sign-In did not load.");

  accounts.initialize({
    client_id: siteConfig.google.clientId,
    callback: (response) => onToken(response.credential),
  });
  accounts.renderButton(container, {
    type: "standard",
    theme: "filled_black",
    size: "large",
    text: "signin_with",
    shape: "pill",
  });
}

/** Stops Google from silently re-signing the admin back in on next visit. */
export function disableAutoSelect(): void {
  window.google?.accounts.id.disableAutoSelect();
}
