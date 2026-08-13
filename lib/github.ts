/**
 * Minimal GitHub REST client for the admin panel.
 *
 * The repo is the database. Publishing writes content/site.json and any new
 * images in a SINGLE commit via the Git Data API (blobs -> tree -> commit ->
 * ref). One commit means one GitHub Actions run and one deploy, instead of one
 * per changed file.
 */

import { siteConfig } from "@/site.config";

const API_ROOT = "https://api.github.com";

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

/** A file to write in the next commit. */
export interface PendingFile {
  /** Repo-relative path, e.g. "public/uploads/court-1712.jpg". */
  path: string;
  /** Base64-encoded file contents. */
  base64: string;
}

async function api<T>(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
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

export function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  return api<GitHubUser>(token, "/user");
}

/**
 * Confirms the signed-in account can actually push. Without this the admin
 * would only discover the problem when publishing fails.
 */
export async function hasPushAccess(token: string): Promise<boolean> {
  const { owner, name } = siteConfig.repo;
  try {
    const repo = await api<{ permissions?: { push?: boolean } }>(
      token,
      `/repos/${owner}/${name}`
    );
    return repo.permissions?.push === true;
  } catch {
    return false;
  }
}

export interface LoadedContent {
  /** Raw JSON text as stored in the repo. */
  text: string;
  /** Blob sha of the file when it was read — used to detect concurrent edits. */
  sha: string;
}

/** Reads content/site.json from the branch the site deploys from. */
export async function loadContentFile(token: string): Promise<LoadedContent> {
  const { owner, name, branch } = siteConfig.repo;
  const file = await api<{ content: string; sha: string }>(
    token,
    `/repos/${owner}/${name}/contents/${siteConfig.contentPath}?ref=${branch}`,
    { cache: "no-store" }
  );
  return { text: decodeBase64(file.content), sha: file.sha };
}

/** Current blob sha of the content file, for pre-publish conflict checks. */
export async function getContentSha(token: string): Promise<string> {
  const { owner, name, branch } = siteConfig.repo;
  const file = await api<{ sha: string }>(
    token,
    `/repos/${owner}/${name}/contents/${siteConfig.contentPath}?ref=${branch}`,
    { cache: "no-store" }
  );
  return file.sha;
}

/**
 * Writes every changed file as one commit on the deploy branch.
 * Returns the new commit sha.
 */
export async function commitFiles(
  token: string,
  files: PendingFile[],
  message: string
): Promise<string> {
  const { owner, name, branch } = siteConfig.repo;
  const base = `/repos/${owner}/${name}/git`;

  // 1. Where the branch currently points.
  const ref = await api<{ object: { sha: string } }>(
    token,
    `${base}/ref/heads/${branch}`,
    { cache: "no-store" }
  );
  const headSha = ref.object.sha;

  // 2. The tree that commit points at.
  const headCommit = await api<{ tree: { sha: string } }>(
    token,
    `${base}/commits/${headSha}`
  );

  // 3. Upload each file as a blob.
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await api<{ sha: string }>(token, `${base}/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: file.base64, encoding: "base64" }),
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // 4. Layer them over the existing tree.
  const tree = await api<{ sha: string }>(token, `${base}/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: blobs }),
  });

  // 5. Commit, then 6. move the branch.
  const commit = await api<{ sha: string }>(token, `${base}/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  });

  await api(token, `${base}/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

/** Link to the Actions tab, where the admin can watch the deploy run. */
export function actionsUrl(): string {
  const { owner, name } = siteConfig.repo;
  return `https://github.com/${owner}/${name}/actions`;
}
