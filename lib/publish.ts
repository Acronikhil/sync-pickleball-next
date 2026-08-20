/**
 * Publishing content changes.
 *
 * The browser never talks to GitHub for writes. It hands the Worker a Google
 * ID token plus the files to commit; the Worker — the only thing holding a
 * GitHub token — verifies the token, checks the signed-in email against its
 * allow-list, and makes the commit. See oauth-worker/worker.js.
 */

import { siteConfig } from "@/site.config";

/** A file to write in the next commit. */
export interface PendingFile {
  /** Repo-relative path, e.g. "public/uploads/court-1712.jpg". */
  path: string;
  /** Base64-encoded file contents. */
  base64: string;
}

export type PublishErrorCode =
  | "conflict"
  | "unauthenticated"
  | "forbidden"
  | "publish_failed"
  | "network"
  | "unknown";

export class PublishError extends Error {
  constructor(
    message: string,
    public readonly code: PublishErrorCode,
    public readonly status: number
  ) {
    super(message);
    this.name = "PublishError";
  }
}

export interface PublishResult {
  sha: string;
}

/**
 * Commits `files` as a single commit. If `baseSha` no longer matches the live
 * content/site.json, the Worker refuses with a `conflict` error unless
 * `force` is set — that's the "someone else published while you were
 * editing" check, enforced server-side rather than raced client-side.
 */
export async function publishContent(params: {
  idToken: string;
  files: PendingFile[];
  message: string;
  baseSha: string;
  force?: boolean;
}): Promise<PublishResult> {
  let response: Response;
  try {
    response = await fetch(`${siteConfig.publishUrl}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: params.idToken,
        files: params.files,
        message: params.message,
        baseSha: params.baseSha,
        force: params.force ?? false,
      }),
    });
  } catch {
    throw new PublishError(
      "Could not reach the publish service. Check your connection and try again.",
      "network",
      0
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    sha?: string;
    error?: string;
    error_description?: string;
    currentSha?: string;
  };

  if (response.status === 409) {
    throw new PublishError(
      "The live content changed since you opened this editor.",
      "conflict",
      409
    );
  }

  if (!response.ok || !payload.sha) {
    const code: PublishErrorCode =
      payload.error === "unauthenticated" || payload.error === "forbidden"
        ? payload.error
        : "unknown";
    throw new PublishError(
      payload.error_description ?? payload.error ?? "Publish failed.",
      code,
      response.status
    );
  }

  return { sha: payload.sha };
}
