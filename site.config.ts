/**
 * Build-time configuration.
 *
 * This is a statically exported site, so there is no server to read secrets at
 * runtime — everything here is baked into the JS bundle and is therefore
 * PUBLIC. That is fine for all of it: a Google OAuth *client id* is public by
 * design, and the GitHub token that can actually write to the repo lives only
 * in the Cloudflare Worker (see oauth-worker/). Never put a token or secret in
 * this file.
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

  google: {
    /** Google OAuth 2.0 Web client id. Public by design. */
    clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  },

  /**
   * Base URL of the Cloudflare Worker that verifies the signed-in Google
   * account and commits on its behalf (its endpoint is `${publishUrl}/publish`).
   * This Worker is the only thing in the whole system that can write to the
   * repo — see oauth-worker/.
   */
  publishUrl: env.NEXT_PUBLIC_PUBLISH_URL ?? "",

  /**
   * Google accounts allowed into the editor, comma-separated, case-insensitive.
   * This is a convenience gate for the UI only — the real control is the
   * Worker, which holds its own copy of this list and re-checks the verified
   * email server-side on every publish.
   */
  adminEmails: (env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  /** Image uploads are downscaled in the browser before being committed. */
  imageUpload: {
    maxWidth: 1600,
    quality: 0.82,
  },
} as const;

export type SiteConfig = typeof siteConfig;
