/**
 * Minimal client for reading the site's content from GitHub.
 *
 * Reads are unauthenticated: the repo is public, so content/site.json can be
 * fetched without a token, well within GitHub's unauthenticated rate limit
 * (60 requests/hour/IP) for a single admin's editing session. Writes are a
 * different story — they need a token with push access, which never reaches
 * the browser. See lib/publish.ts and oauth-worker/.
 */

import { siteConfig } from "@/site.config";

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      /* non-JSON error body — the status text will do */
    }
    throw new GitHubError(detail, response.status);
  }

  return (await response.json()) as T;
}

/* ---------------------------- base64 helpers ---------------------------- */

/** Decodes base64 into a string, correctly handling multi-byte UTF-8. */
export function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encodes a string to base64, correctly handling multi-byte UTF-8. */
export function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  // Chunked to stay well clear of the argument limit on large payloads.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/* ------------------------------- requests ------------------------------- */

export interface LoadedContent {
  /** Raw JSON text as stored in the repo. */
  text: string;
  /** Blob sha of the file when it was read — used to detect concurrent edits. */
  sha: string;
}

/** Reads content/site.json from the branch the site deploys from. */
export async function loadContentFile(): Promise<LoadedContent> {
  const { owner, name, branch } = siteConfig.repo;
  const file = await api<{ content: string; sha: string }>(
    `/repos/${owner}/${name}/contents/${siteConfig.contentPath}?ref=${branch}`
  );
  return { text: decodeBase64(file.content), sha: file.sha };
}

/** Current blob sha of the content file, for pre-publish conflict checks. */
export async function getContentSha(): Promise<string> {
  const { owner, name, branch } = siteConfig.repo;
  const file = await api<{ sha: string }>(
    `/repos/${owner}/${name}/contents/${siteConfig.contentPath}?ref=${branch}`
  );
  return file.sha;
}

/** Link to the Actions tab, where the admin can watch the deploy run. */
export function actionsUrl(): string {
  const { owner, name } = siteConfig.repo;
  return `https://github.com/${owner}/${name}/actions`;
}
