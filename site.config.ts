/**
 * Build-time configuration.
 *
 * This is a statically exported site, so there is no server to read secrets at
 * runtime — everything here is baked into the JS bundle and is therefore
 * PUBLIC. That is fine for all of it: a GitHub OAuth *client id* is public by
 * design, and the client *secret* lives only in the Cloudflare Worker
 * (see oauth-worker/). Never put a token or secret in this file.
 *
 * Values come from NEXT_PUBLIC_* env vars set by .github/workflows/deploy.yml.
 */

const env = process.env;

export const siteConfig = {
  /** Repo the admin panel reads content from and commits content back to. */
  repo: {
    owner: env.NEXT_PUBLIC_REPO_OWNER ?? "Acronikhil",
    name: env.NEXT_PUBLIC_REPO_NAME ?? "sync-pickleball-next",
    branch: env.NEXT_PUBLIC_REPO_BRANCH ?? "main",
  },

  site: {
    /** Canonical origin, no trailing slash. Drives metadata and schema.org. */
    url: env.NEXT_PUBLIC_SITE_URL ?? "https://cms.syncpickleball.com",
    /**
     * Search engines are blocked unless this is explicitly turned on.
     *
     * This subdomain serves the same content as www.syncpickleball.com, and two
     * indexed copies of one page compete with each other — Google picks a
     * winner and it may not be the one you want. Leave indexing off until this
     * site *replaces* www; then set NEXT_PUBLIC_ALLOW_INDEXING=true and point
     * NEXT_PUBLIC_SITE_URL at the live domain.
     */
    allowIndexing: env.NEXT_PUBLIC_ALLOW_INDEXING === "true",
  },

  /** Path within the repo that holds the editable content. */
  contentPath: "content/site.json",

  /** Directory (within the repo) that admin-uploaded images are committed to. */
  uploadsPath: "public/uploads",

  oauth: {
    /** GitHub OAuth App client id. Public by design. */
    clientId: env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "",
    /**
     * URL of the Cloudflare Worker that swaps an OAuth code for a token.
     * GitHub's token endpoint sends no CORS headers and needs the client
     * secret, so the browser cannot do this step itself.
     */
    proxyUrl: env.NEXT_PUBLIC_OAUTH_PROXY_URL ?? "",
    /**
     * "public_repo" is enough for a public repo. Switch to "repo" only if you
     * make this repository private.
     */
    scope: env.NEXT_PUBLIC_OAUTH_SCOPE ?? "public_repo",
  },

  /**
   * GitHub usernames allowed into the editor, comma-separated.
   * This is a convenience gate, not the security boundary — the real control
   * is GitHub itself, which rejects commits from anyone without push access.
   */
  adminUsers: (env.NEXT_PUBLIC_ADMIN_USERS ?? "Acronikhil")
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean),

  /** Image uploads are downscaled in the browser before being committed. */
  imageUpload: {
    maxWidth: 1600,
    quality: 0.82,
  },
} as const;

export type SiteConfig = typeof siteConfig;
