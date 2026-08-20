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
import { actionsUrl, encodeBase64, getContentSha, loadContentFile } from "@/lib/github";
import {
  clearToken,
  decodeIdentity,
  disableAutoSelect,
  getToken,
  isExpired,
  isGoogleConfigured,
  setToken,
  type Identity,
} from "@/lib/auth";
import { PublishError, publishContent, type PendingFile } from "@/lib/publish";
import { formatBytes, prepareImage } from "@/lib/image";
import { SiteRenderer } from "@/components/SiteRenderer";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { UploadProvider } from "@/components/admin/UploadContext";
import { GoogleSignInButton } from "@/components/admin/GoogleSignInButton";
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
  const [identity, setIdentity] = useState<Identity | null>(null);
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

    const account = decodeIdentity(token);
    if (!account || isExpired(account)) {
      clearToken();
      setPhase("anon");
      return;
    }

    tokenRef.current = token;
    setIdentity(account);

    // A convenience check only — the Worker re-verifies this on every publish,
    // and that check is the one that actually matters.
    const allowed =
      siteConfig.adminEmails.length === 0 ||
      siteConfig.adminEmails.includes(account.email);

    if (!allowed) {
      setPhase("denied");
      return;
    }

    (async () => {
      try {
        // The repo is the source of truth — the bundled copy may be stale if
        // someone published from another device since this page was built.
        const file = await loadContentFile();
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
        setPhase("anon");
        setStatus({
          tone: "err",
          message:
            cause instanceof Error
              ? `Could not load content: ${cause.message}`
              : "Could not load content.",
        });
      }
    })();
  }, []);

  const handleToken = useCallback((idToken: string) => {
    setToken(idToken);
    // Simplest correct way to re-run the sign-in effect cleanly.
    window.location.reload();
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
    if (!token || !identity) return;

    if (isExpired(identity)) {
      setStatus({
        tone: "err",
        message: "Your sign-in expired. Please sign in again.",
      });
      clearToken();
      setPhase("anon");
      return;
    }

    setPublishing(true);
    setStatus({ tone: "idle", message: "Publishing…" });

    const files: PendingFile[] = [
      { path: siteConfig.contentPath, base64: encodeBase64(serialised) },
      ...uploads.map((upload) => ({
        path: upload.repoPath,
        base64: upload.base64,
      })),
    ];
    const imageNote =
      uploads.length > 0
        ? ` (+${uploads.length} image${uploads.length === 1 ? "" : "s"})`
        : "";
    const message = `Update site content via admin${imageNote}`;

    try {
      let result;
      try {
        result = await publishContent({ idToken: token, files, message, baseSha });
      } catch (cause) {
        if (cause instanceof PublishError && cause.code === "conflict") {
          const overwrite = window.confirm(
            "The live content changed since you opened this editor — someone " +
              "may have published from another device.\n\nPublish anyway and " +
              "overwrite their changes?"
          );
          if (!overwrite) {
            setStatus({
              tone: "err",
              message:
                "Publish cancelled. Reload the page to get the latest content.",
            });
            return;
          }
          result = await publishContent({
            idToken: token,
            files,
            message,
            baseSha,
            force: true,
          });
        } else {
          throw cause;
        }
      }

      setBaseline(serialised);
      setBaseSha(await getContentSha());
      setUploads([]);
      window.localStorage.removeItem(DRAFT_KEY);
      setStatus({
        tone: "ok",
        message: `Published as ${result.sha.slice(0, 7)}. The site rebuilds in about a minute.`,
      });
    } catch (cause) {
      if (cause instanceof PublishError && cause.code === "unauthenticated") {
        setStatus({
          tone: "err",
          message: "Your sign-in expired. Please sign in again.",
        });
        clearToken();
        setTimeout(() => setPhase("anon"), 1200);
        return;
      }
      setStatus({
        tone: "err",
        message:
          cause instanceof Error ? `Publish failed: ${cause.message}` : "Publish failed.",
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
    disableAutoSelect();
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
    return <LoginScreen status={status} onToken={handleToken} />;
  }

  if (phase === "denied") {
    return (
      <div className="a-shell">
        <div className="a-login">
          <h1>No access</h1>
          <p>
            You are signed in as <strong>{identity?.email}</strong>, but that
            account is not on the list of editors for this site.
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

          {identity && (
            <span className="a-user">
              {identity.picture && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identity.picture} alt="" referrerPolicy="no-referrer" />
              )}
              {identity.name}
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

function LoginScreen({
  status,
  onToken,
}: {
  status: Status;
  onToken: (idToken: string) => void;
}) {
  const configured = isGoogleConfigured();

  return (
    <div className="a-shell">
      <div className="a-login">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="a-login-logo" src="/assets/logo.png" alt="" />
        <h1>Sync content editor</h1>

        {configured ? (
          <>
            <p>Sign in with an authorised Google account to edit the site.</p>
            {status.message && (
              <p className={`a-status a-status-${status.tone}`}>
                {status.message}
              </p>
            )}
            <GoogleSignInButton onToken={onToken} />
          </>
        ) : (
          <>
            <p>The editor is not connected to Google Sign-In yet.</p>
            <div className="a-setup">
              <strong>One-time setup</strong>
              <ol style={{ paddingLeft: "1.1rem", margin: "0.5rem 0 0" }}>
                <li>
                  Create a Google OAuth Web client id with this site as an
                  authorised JavaScript origin
                </li>
                <li>
                  Deploy <code>oauth-worker/</code> to Cloudflare and set{" "}
                  <code>GITHUB_TOKEN</code>
                </li>
                <li>
                  Add <code>GOOGLE_CLIENT_ID</code>, <code>PUBLISH_URL</code> and{" "}
                  <code>ADMIN_EMAILS</code> as repository variables, then re-run
                  the deploy workflow
                </li>
              </ol>
              <p style={{ margin: "0.6rem 0 0" }}>
                Full instructions are in the repository&rsquo;s{" "}
                <code>README.md</code>.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
