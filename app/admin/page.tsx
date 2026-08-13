"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./admin.css";

import { siteConfig } from "@/site.config";
import {
  createId,
  createSection,
  type AnySection,
  type BodySection,
  type SectionType,
  type SiteContent,
} from "@/lib/content";
import { siteContent as bundledContent } from "@/lib/site-content";
import {
  actionsUrl,
  commitFiles,
  encodeBase64,
  getAuthenticatedUser,
  getContentSha,
  hasPushAccess,
  loadContentFile,
  type GitHubUser,
  type PendingFile,
} from "@/lib/github";
import {
  beginLogin,
  clearToken,
  getToken,
  isOAuthConfigured,
} from "@/lib/auth";
import { formatBytes, prepareImage } from "@/lib/image";
import { SiteRenderer } from "@/components/SiteRenderer";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { UploadProvider } from "@/components/admin/UploadContext";
import {
  CheckboxField,
  ImageField,
  TextField,
} from "@/components/admin/Fields";

const DRAFT_KEY = "sync-admin-draft";

type Phase = "loading" | "anon" | "denied" | "ready";

interface QueuedUpload {
  repoPath: string;
  base64: string;
  src: string;
  previewUrl: string;
  bytes: number;
}

interface Status {
  tone: "idle" | "dirty" | "ok" | "err";
  message: string;
}

/** Swaps not-yet-published image paths for their data URLs, for the preview. */
function withPreviews(
  content: SiteContent,
  previews: Record<string, string>
): SiteContent {
  if (Object.keys(previews).length === 0) return content;
  const next = structuredClone(content);
  const resolve = (src: string) => previews[src] ?? src;

  next.hero.logo.src = resolve(next.hero.logo.src);
  next.cursor.image = resolve(next.cursor.image);
  for (const section of next.sections) {
    if (section.type === "feature") {
      section.image.src = resolve(section.image.src);
    } else if (section.type === "trio") {
      for (const card of section.cards) card.image.src = resolve(card.image.src);
    }
  }
  return next;
}

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [content, setContent] = useState<SiteContent>(bundledContent);
  const [baseline, setBaseline] = useState<string>("");
  const [baseSha, setBaseSha] = useState<string>("");
  const [uploads, setUploads] = useState<QueuedUpload[]>([]);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [publishing, setPublishing] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const tokenRef = useRef<string | null>(null);

  const serialised = useMemo(
    () => `${JSON.stringify(content, null, 2)}\n`,
    [content]
  );
  const isDirty = baseline !== "" && serialised !== baseline;
  const hasUploads = uploads.length > 0;

  const previews = useMemo(
    () => Object.fromEntries(uploads.map((u) => [u.src, u.previewUrl])),
    [uploads]
  );
  const previewContent = useMemo(
    () => withPreviews(content, previews),
    [content, previews]
  );

  /* ------------------------------ sign in ------------------------------ */

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setPhase("anon");
      return;
    }
    tokenRef.current = token;

    (async () => {
      try {
        const account = await getAuthenticatedUser(token);
        const allowed =
          siteConfig.adminUsers.length === 0 ||
          siteConfig.adminUsers.includes(account.login.toLowerCase());

        if (!allowed || !(await hasPushAccess(token))) {
          setUser(account);
          setPhase("denied");
          return;
        }

        setUser(account);

        // The repo is the source of truth — the bundled copy may be stale if
        // someone published from another device since this page was built.
        const file = await loadContentFile(token);
        const remote = JSON.parse(file.text) as SiteContent;
        setBaseSha(file.sha);
        setBaseline(`${JSON.stringify(remote, null, 2)}\n`);

        const draft =
          typeof window !== "undefined"
            ? window.localStorage.getItem(DRAFT_KEY)
            : null;
        if (draft) {
          try {
            setContent(JSON.parse(draft) as SiteContent);
            setStatus({
              tone: "dirty",
              message: "Restored unpublished changes from this browser.",
            });
          } catch {
            setContent(remote);
          }
        } else {
          setContent(remote);
        }

        setPhase("ready");
      } catch (cause) {
        clearToken();
        tokenRef.current = null;
        setPhase("anon");
        setStatus({
          tone: "err",
          message:
            cause instanceof Error
              ? `Could not sign in: ${cause.message}`
              : "Could not sign in.",
        });
      }
    })();
  }, []);

  /* --------------------------- draft handling --------------------------- */

  useEffect(() => {
    if (phase !== "ready" || baseline === "") return;
    if (serialised === baseline) {
      window.localStorage.removeItem(DRAFT_KEY);
    } else {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(content));
    }
  }, [content, serialised, baseline, phase]);

  useEffect(() => {
    if (!isDirty && !hasUploads) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, hasUploads]);

  /* ------------------------------ mutations ------------------------------ */

  const mutate = useCallback((recipe: (draft: SiteContent) => void) => {
    setContent((previous) => {
      const next = structuredClone(previous);
      recipe(next);
      return next;
    });
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    const prepared = await prepareImage(file);
    setUploads((previous) => [
      ...previous,
      {
        repoPath: prepared.repoPath,
        base64: prepared.base64,
        src: prepared.src,
        previewUrl: prepared.previewUrl,
        bytes: prepared.bytes,
      },
    ]);
    return prepared.src;
  }, []);

  const uploadApi = useMemo(() => ({ uploadImage }), [uploadImage]);

  function replaceSection(index: number, section: AnySection) {
    mutate((draft) => {
      draft.sections[index] = section as BodySection;
    });
  }

  function moveSection(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= content.sections.length) return;
    mutate((draft) => {
      const [moved] = draft.sections.splice(index, 1);
      draft.sections.splice(target, 0, moved);
    });
  }

  function deleteSection(index: number) {
    const label = content.sections[index].type;
    if (!window.confirm(`Delete this "${label}" section? This can't be undone.`))
      return;
    mutate((draft) => {
      draft.sections.splice(index, 1);
    });
  }

  function duplicateSection(index: number) {
    mutate((draft) => {
      const copy = structuredClone(draft.sections[index]);
      copy.id = createId(copy.type);
      if (copy.type === "trio") {
        for (const card of copy.cards) card.id = createId("card");
      } else {
        for (const button of copy.buttons) button.id = createId("btn");
      }
      draft.sections.splice(index + 1, 0, copy);
    });
  }

  function addSection(type: SectionType) {
    mutate((draft) => {
      draft.sections.push(createSection(type));
    });
  }

  /* ------------------------------ publishing ------------------------------ */

  async function publish() {
    const token = tokenRef.current;
    if (!token) return;

    setPublishing(true);
    setStatus({ tone: "idle", message: "Publishing…" });

    try {
      // Someone may have published from another device since this page loaded.
      const currentSha = await getContentSha(token);
      if (currentSha !== baseSha) {
        const overwrite = window.confirm(
          "The live content changed since you opened this editor — someone may " +
            "have published from another device.\n\nPublish anyway and overwrite " +
            "their changes?"
        );
        if (!overwrite) {
          setStatus({
            tone: "err",
            message: "Publish cancelled. Reload the page to get the latest content.",
          });
          return;
        }
      }

      const files: PendingFile[] = [
        {
          path: siteConfig.contentPath,
          base64: encodeBase64(serialised),
        },
        ...uploads.map((upload) => ({
          path: upload.repoPath,
          base64: upload.base64,
        })),
      ];

      const imageNote =
        uploads.length > 0
          ? ` (+${uploads.length} image${uploads.length === 1 ? "" : "s"})`
          : "";
      const sha = await commitFiles(
        token,
        files,
        `Update site content via admin${imageNote}`
      );

      setBaseline(serialised);
      setBaseSha(await getContentSha(token));
      setUploads([]);
      window.localStorage.removeItem(DRAFT_KEY);
      setStatus({
        tone: "ok",
        message: `Published as ${sha.slice(0, 7)}. The site rebuilds in about a minute.`,
      });
    } catch (cause) {
      setStatus({
        tone: "err",
        message:
          cause instanceof Error
            ? `Publish failed: ${cause.message}`
            : "Publish failed.",
      });
    } finally {
      setPublishing(false);
    }
  }

  function discard() {
    if (!window.confirm("Discard all unpublished changes?")) return;
    setContent(JSON.parse(baseline) as SiteContent);
    setUploads([]);
    window.localStorage.removeItem(DRAFT_KEY);
    setStatus({ tone: "idle", message: "Changes discarded." });
  }

  function signOut() {
    clearToken();
    window.location.reload();
  }

  /* -------------------------------- views -------------------------------- */

  if (phase === "loading") {
    return (
      <div className="a-shell">
        <div className="a-login">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (phase === "anon") {
    return <LoginScreen status={status} />;
  }

  if (phase === "denied") {
    return (
      <div className="a-shell">
        <div className="a-login">
          <h1>No access</h1>
          <p>
            You are signed in as <strong>{user?.login}</strong>, but that account
            cannot push to {siteConfig.repo.owner}/{siteConfig.repo.name}.
          </p>
          <button type="button" className="a-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const pendingBytes = uploads.reduce((sum, upload) => sum + upload.bytes, 0);

  return (
    <UploadProvider value={uploadApi}>
      <div className="a-shell">
        <div className="a-topbar">
          <span className="a-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="" />
            Sync content editor
          </span>

          <span className="a-spacer" />

          {status.message && (
            <span className={`a-status a-status-${status.tone}`}>
              {status.message}
            </span>
          )}

          {isDirty && !status.message && (
            <span className="a-status a-status-dirty">Unpublished changes</span>
          )}

          <button
            type="button"
            className="a-btn a-btn-quiet a-mobile-toggle"
            onClick={() =>
              setMobileView((view) => (view === "editor" ? "preview" : "editor"))
            }
          >
            {mobileView === "editor" ? "Preview" : "Edit"}
          </button>

          <button
            type="button"
            className="a-btn a-btn-quiet"
            onClick={discard}
            disabled={!isDirty && !hasUploads}
          >
            Discard
          </button>

          <button
            type="button"
            className="a-btn a-btn-primary"
            onClick={() => void publish()}
            disabled={publishing || (!isDirty && !hasUploads)}
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>

          {user && (
            <span className="a-user">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar_url} alt="" />
              {user.login}
              <button
                type="button"
                className="a-icon-btn"
                title="Sign out"
                onClick={signOut}
              >
                ⏻
              </button>
            </span>
          )}
        </div>

        {hasUploads && (
          <div className="a-banner">
            {uploads.length} new image{uploads.length === 1 ? "" : "s"} (
            {formatBytes(pendingBytes)}) will be committed when you publish.
          </div>
        )}

        <div className="a-layout" data-mobile-view={mobileView}>
          <div className="a-editor-pane">
            <h2 className="a-section-title">Header</h2>
            <SectionEditor
              section={content.hero}
              previews={previews}
              onChange={(hero) =>
                mutate((draft) => {
                  draft.hero = hero as SiteContent["hero"];
                })
              }
            />

            <h2 className="a-section-title">Page sections</h2>
            {content.sections.map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                previews={previews}
                onChange={(updated) => replaceSection(index, updated)}
                controls={{
                  onMoveUp: () => moveSection(index, -1),
                  onMoveDown: () => moveSection(index, 1),
                  onDelete: () => deleteSection(index),
                  onDuplicate: () => duplicateSection(index),
                  canMoveUp: index > 0,
                  canMoveDown: index < content.sections.length - 1,
                }}
              />
            ))}

            <div className="a-subsection-head" style={{ marginTop: "0.9rem" }}>
              <span className="a-label">Add a section</span>
              <span style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  className="a-btn a-btn-quiet a-btn-sm"
                  onClick={() => addSection("feature")}
                >
                  + Wide card
                </button>
                <button
                  type="button"
                  className="a-btn a-btn-quiet a-btn-sm"
                  onClick={() => addSection("trio")}
                >
                  + Three cards
                </button>
                <button
                  type="button"
                  className="a-btn a-btn-quiet a-btn-sm"
                  onClick={() => addSection("cta")}
                >
                  + Call to action
                </button>
              </span>
            </div>

            <h2 className="a-section-title">Contact links</h2>
            <div className="a-card">
              <div className="a-card-body">
                {content.socials.map((social, index) => (
                  <div key={social.id} className="a-nested">
                    <div className="a-nested-head">
                      <strong>{social.icon}</strong>
                    </div>
                    <TextField
                      label="Link"
                      value={social.href}
                      onChange={(href) =>
                        mutate((draft) => {
                          draft.socials[index].href = href;
                        })
                      }
                    />
                    <TextField
                      label="Accessible label"
                      value={social.label}
                      onChange={(label) =>
                        mutate((draft) => {
                          draft.socials[index].label = label;
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <h2 className="a-section-title">Footer</h2>
            <div className="a-card">
              <div className="a-card-body">
                <TextField
                  label="Copyright line"
                  value={content.footer.copyright}
                  onChange={(copyright) =>
                    mutate((draft) => {
                      draft.footer.copyright = copyright;
                    })
                  }
                />
                <TextField
                  label="Credit prefix"
                  value={content.footer.creditPrefix}
                  onChange={(creditPrefix) =>
                    mutate((draft) => {
                      draft.footer.creditPrefix = creditPrefix;
                    })
                  }
                />
                <TextField
                  label="Credit name"
                  value={content.footer.creditName}
                  onChange={(creditName) =>
                    mutate((draft) => {
                      draft.footer.creditName = creditName;
                    })
                  }
                />
                <TextField
                  label="Credit link"
                  value={content.footer.creditHref}
                  onChange={(creditHref) =>
                    mutate((draft) => {
                      draft.footer.creditHref = creditHref;
                    })
                  }
                />
              </div>
            </div>

            <h2 className="a-section-title">Cursor effect</h2>
            <div className="a-card">
              <div className="a-card-body">
                <CheckboxField
                  label="Show the pickleball that follows the cursor"
                  checked={content.cursor.enabled}
                  onChange={(enabled) =>
                    mutate((draft) => {
                      draft.cursor.enabled = enabled;
                    })
                  }
                />
                <ImageField
                  label="Cursor image"
                  value={{ src: content.cursor.image, alt: "" }}
                  previewSrc={previews[content.cursor.image]}
                  onChange={(image) =>
                    mutate((draft) => {
                      draft.cursor.image = image.src;
                    })
                  }
                />
              </div>
            </div>

            <p className="a-hint" style={{ marginTop: "1.5rem" }}>
              Publishing commits to the <code>{siteConfig.repo.branch}</code>{" "}
              branch and triggers a rebuild.{" "}
              <a
                href={actionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#d7afff" }}
              >
                Watch the deploy →
              </a>
            </p>
          </div>

          <div className="a-preview-pane">
            <div className="a-preview-note">Live preview</div>
            <SiteRenderer content={previewContent} />
          </div>
        </div>
      </div>
    </UploadProvider>
  );
}

/* ------------------------------ login screen ------------------------------ */

function LoginScreen({ status }: { status: Status }) {
  const configured = isOAuthConfigured();
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="a-shell">
      <div className="a-login">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="a-login-logo" src="/assets/logo.png" alt="" />
        <h1>Sync content editor</h1>

        {configured ? (
          <>
            <p>
              Sign in with the GitHub account that owns{" "}
              {siteConfig.repo.owner}/{siteConfig.repo.name} to edit the site.
            </p>
            {status.message && (
              <p className={`a-status a-status-${status.tone}`}>
                {status.message}
              </p>
            )}
            <button
              type="button"
              className="a-btn a-btn-primary"
              onClick={beginLogin}
            >
              Sign in with GitHub
            </button>
          </>
        ) : (
          <>
            <p>The editor is not connected to GitHub yet.</p>
            <div className="a-setup">
              <strong>One-time setup</strong>
              <ol style={{ paddingLeft: "1.1rem", margin: "0.5rem 0 0" }}>
                <li>
                  Create a GitHub OAuth App with callback URL{" "}
                  <code>{origin || "https://www.syncpickleball.com"}/admin/callback/</code>
                </li>
                <li>
                  Deploy <code>oauth-worker/</code> to Cloudflare and set{" "}
                  <code>GITHUB_CLIENT_SECRET</code>
                </li>
                <li>
                  Add <code>OAUTH_CLIENT_ID</code> and{" "}
                  <code>OAUTH_PROXY_URL</code> as repository variables, then
                  re-run the deploy workflow
                </li>
              </ol>
              <p style={{ margin: "0.6rem 0 0" }}>
                Full instructions are in <code>docs/ADMIN-SETUP.md</code>.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
