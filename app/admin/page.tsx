"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./admin.css";

import { siteConfig } from "@/site.config";
import {
  createId,
  createSection,
  emptyClubInfo,
  DEFAULT_MASCOT_NAME,
  mascotName,
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
import { SectionEditor } from "@/components/admin/SectionEditor";
import { PreviewFrame, type PreviewDevice } from "@/components/admin/PreviewFrame";
import { AdminHelp } from "@/components/admin/AdminHelp";
import { AdminTour, TOUR_DONE_KEY } from "@/components/admin/AdminTour";
import { UploadProvider } from "@/components/admin/UploadContext";
import { GoogleSignInButton } from "@/components/admin/GoogleSignInButton";
import {
  CheckboxField,
  ImageField,
  SelectField,
  TextField,
} from "@/components/admin/Fields";
import { activeTheme, manualTheme, THEME_NAMES, THEMES } from "@/lib/themes";
import { ThemeScheduleEditor } from "@/components/admin/ThemeScheduleEditor";
import { InfoEditor } from "@/components/admin/InfoEditor";

const DRAFT_KEY = "sync-admin-draft";

/** The editor's areas, in menu order. `focus` is where the preview scrolls. */
const AREAS = [
  { id: "header", label: "Header", focus: "#top", hint: "Logo, headline, intro text, background photo and buttons at the top of the page." },
  { id: "sections", label: "Page sections", focus: "#main", hint: "The blocks that make up the page. Open one to edit it, reorder them or add new ones." },
  { id: "info", label: "Club info", focus: "#info", hint: "Opening hours, prices, café menu and reviews. Each one has its own switch." },
  { id: "festival", label: "Festival theme", focus: "#top", hint: "Dress the whole site up for Christmas, Diwali, Holi, New Year or the club anniversary." },
  { id: "contact", label: "Contact & footer", focus: "#visit", hint: "Phone, Instagram, email and map links, plus the lines at the very bottom." },
  { id: "settings", label: "Settings", focus: "#top", hint: "Extra touches, and where to watch the site update after you publish." },
] as const;

type AreaId = (typeof AREAS)[number]["id"];

/**
 * Sets the penguin's name and swaps the old name for the new one wherever it
 * appears in the page text (captions, intros, photo descriptions), so a
 * rename doesn't leave stale mentions behind. Whole words only, and only
 * once the old name is long enough not to match bits of other words.
 */
function renameMascot(draft: SiteContent, name: string) {
  const previous = mascotName(draft);
  draft.mascot = { name };
  const next = name.trim();
  if (previous.length < 3 || !next || next === previous) return;

  const word = new RegExp(`\\b${previous.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  const swap = (value: unknown): unknown => {
    if (typeof value === "string") return value.replace(word, next);
    if (Array.isArray(value)) return value.map(swap);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swap(v)]));
    }
    return value;
  };
  draft.sections = swap(draft.sections) as BodySection[];
  draft.hero = swap(draft.hero) as SiteContent["hero"];
}

/**
 * The penguin's name field. The rename is applied when you finish typing
 * (leave the field or press Enter), not on every keystroke: otherwise typing
 * "Pickles" would first rename every mention to "P", and the next letters
 * could no longer find them.
 */
function MascotNameField({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);
  const commit = () => {
    if (value.trim() && value.trim() !== name) onRename(value.trim());
    else setValue(name);
  };
  return (
    <div className="a-field">
      <label className="a-label" htmlFor="mascot-name">
        Penguin&apos;s name
      </label>
      <input
        id="mascot-name"
        className="a-input"
        type="text"
        value={value}
        maxLength={24}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") (event.target as HTMLInputElement).blur();
        }}
      />
      <p className="a-hint">
        Used in the penguin&apos;s greeting and on the page-not-found screen. When you
        rename it, every mention of the old name on the site is updated too.
      </p>
    </div>
  );
}

/** What each kind of new section looks like, for the "Add a section" cards. */
const NEW_SECTIONS: { type: SectionType; label: string; hint: string }[] = [
  { type: "feature", label: "Wide card", hint: "A big photo beside a title, text and buttons." },
  { type: "trio", label: "Three cards", hint: "Three photos, each with a short title and text." },
  { type: "gallery", label: "Gallery", hint: "A strip of photos visitors scroll sideways." },
  { type: "cta", label: "Call to action", hint: "A bold panel with a heading and a booking button." },
];

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
  if (next.hero.background) {
    next.hero.background.src = resolve(next.hero.background.src);
  }
  next.cursor.image = resolve(next.cursor.image);
  for (const section of next.sections) {
    if (section.type === "feature") {
      section.image.src = resolve(section.image.src);
    } else if (section.type === "trio") {
      for (const card of section.cards) card.image.src = resolve(card.image.src);
    } else if (section.type === "gallery") {
      for (const photo of section.images) photo.image.src = resolve(photo.image.src);
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
  const [area, setArea] = useState<AreaId>("header");
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const serialised = useMemo(
    () => `${JSON.stringify(content, null, 2)}\n`,
    [content]
  );
  const isDirty = baseline !== "" && serialised !== baseline;
  // Only photos the page still points at get published. One that was
  // replaced again before publishing would otherwise be committed for nothing.
  const usedUploads = useMemo(
    () => uploads.filter((upload) => serialised.includes(upload.src)),
    [uploads, serialised]
  );
  const hasUploads = usedUploads.length > 0;

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

  // First visit: run the tour once the editor has loaded.
  useEffect(() => {
    if (phase !== "ready") return;
    let done = false;
    try {
      done = localStorage.getItem(TOUR_DONE_KEY) === "1";
    } catch {}
    if (!done) {
      const t = window.setTimeout(() => setTourOpen(true), 900);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

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
      } else if (copy.type === "gallery") {
        for (const photo of copy.images) photo.id = createId("photo");
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
      ...usedUploads.map((upload) => ({
        path: upload.repoPath,
        base64: upload.base64,
      })),
    ];
    const imageNote =
      usedUploads.length > 0
        ? ` (+${usedUploads.length} image${usedUploads.length === 1 ? "" : "s"})`
        : "";
    const message = `Update site content via admin${imageNote}`;

    try {
      let result;
      try {
        result = await publishContent({ idToken: token, files, message, baseSha });
      } catch (cause) {
        if (cause instanceof PublishError && cause.code === "conflict") {
          const overwrite = window.confirm(
            "The live content changed since you opened this editor. Someone " +
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
      <div className="a-shell a-center">
        <div className="a-loading">
          <span className="a-spinner" aria-hidden="true" />
          <p>Opening the editor…</p>
        </div>
      </div>
    );
  }

  if (phase === "anon") {
    return <LoginScreen status={status} onToken={handleToken} />;
  }

  if (phase === "denied") {
    return (
      <div className="a-shell a-center">
        <div className="a-login-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="a-login-logo" src="/assets/logo.png" alt="" />
          <h1>This account can&apos;t edit the site</h1>
          <p>
            You are signed in as <strong>{identity?.email}</strong>, which isn&apos;t on
            the list of editors. Sign out and use an approved account, or ask the
            site owner to add this one.
          </p>
          <button type="button" className="a-btn a-btn-primary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const pendingBytes = usedUploads.reduce((sum, upload) => sum + upload.bytes, 0);
  const current = AREAS.find((a) => a.id === area) ?? AREAS[0];
  const previewFocus =
    area === "sections" && content.sections[0] ? `#${content.sections[0].id}` : current.focus;
  const changed = isDirty || hasUploads;

  // One status line: errors and results win, then publishing, then whether
  // there's unpublished work.
  // `short` is what fits on a phone.
  const pill = publishing
    ? { tone: "idle", text: "Publishing…", short: "Publishing…" }
    : status.tone === "err"
      ? { tone: "err", text: status.message, short: "Something went wrong" }
      : status.tone === "ok"
        ? { tone: "ok", text: status.message, short: "Published" }
        : changed
          ? { tone: "dirty", text: "Unpublished changes, saved in this browser", short: "Not published yet" }
          : { tone: "ok", text: "Everything is published", short: "Published" };

  return (
    <UploadProvider value={uploadApi}>
      <div className="a-shell a-app">
        <header className="a-topbar">
          <span className="a-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.png" alt="" />
            <span>
              Sync <span className="a-brand-sub">editor</span>
            </span>
          </span>

          <span className={`a-pill a-pill-${pill.tone}`} data-tour="status" role="status">
            <span className="a-pill-dot" aria-hidden="true" />
            <span className="a-hide-sm">{pill.text}</span>
            <span className="a-show-sm-inline">{pill.short}</span>
          </span>

          <span className="a-spacer" />

          {changed && !publishing && (
            <button type="button" className="a-btn a-btn-quiet a-hide-sm" onClick={discard}>
              Undo changes
            </button>
          )}

          <button
            type="button"
            className="a-btn a-btn-quiet a-btn-icon"
            onClick={() => setHelpOpen(true)}
            data-tour="help"
            aria-label="Help"
          >
            <span aria-hidden="true">?</span>
            <span className="a-hide-sm">Help</span>
          </button>

          <button
            type="button"
            className="a-btn a-btn-primary"
            onClick={() => void publish()}
            disabled={publishing || !changed}
            data-tour="publish"
            title={changed ? "Put your changes on the live site" : "Nothing new to publish"}
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>

          {identity && (
            <div className="a-account">
              <button
                type="button"
                className="a-avatar"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-label="Account"
              >
                {identity.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={identity.picture} alt="" referrerPolicy="no-referrer" />
                ) : (
                  (identity.name || identity.email).slice(0, 1).toUpperCase()
                )}
              </button>
              {menuOpen && (
                <div className="a-menu" role="menu">
                  <p className="a-menu-who">
                    <strong>{identity.name}</strong>
                    <span>{identity.email}</span>
                  </p>
                  {changed && (
                    <button type="button" role="menuitem" className="a-menu-item a-show-sm" onClick={discard}>
                      Undo changes
                    </button>
                  )}
                  <a role="menuitem" className="a-menu-item" href="/" target="_blank" rel="noopener noreferrer">
                    Open the live site ↗
                  </a>
                  <button type="button" role="menuitem" className="a-menu-item" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {hasUploads && (
          <div className="a-banner">
            {usedUploads.length} new photo{usedUploads.length === 1 ? "" : "s"} ({formatBytes(pendingBytes)})
            will be uploaded when you publish.
          </div>
        )}

        <div className="a-workspace" data-mobile-view={mobileView}>
          <nav className="a-rail" aria-label="Editor areas" data-tour="rail">
            {AREAS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`a-rail-item ${area === item.id ? "is-active" : ""}`}
                aria-current={area === item.id ? "page" : undefined}
                onClick={() => {
                  setArea(item.id);
                  setMobileView("editor");
                }}
              >
                <AreaIcon id={item.id} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <main className="a-panel" data-tour="panel">
            <div className="a-panel-head">
              <h1>{current.label}</h1>
              <p>{current.hint}</p>
            </div>

            {area === "header" && (
              <SectionEditor
                section={content.hero}
                previews={previews}
                defaultOpen
                onChange={(hero) =>
                  mutate((draft) => {
                    draft.hero = hero as SiteContent["hero"];
                  })
                }
              />
            )}

            {area === "sections" && (
              <>
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

                <h2 className="a-section-title">Add a section</h2>
                <div className="a-add-grid">
                  {NEW_SECTIONS.map((item) => (
                    <button key={item.type} type="button" className="a-add-card" onClick={() => addSection(item.type)}>
                      <strong>+ {item.label}</strong>
                      <span>{item.hint}</span>
                    </button>
                  ))}
                </div>
                <p className="a-hint">New sections are added at the end of the page. Use the arrows to move them.</p>
              </>
            )}

            {area === "info" && (
              <div className="a-card">
                <div className="a-card-body">
                  <InfoEditor
                    info={content.info ?? emptyClubInfo()}
                    onChange={(info) =>
                      mutate((draft) => {
                        draft.info = info;
                      })
                    }
                  />
                </div>
              </div>
            )}

            {area === "festival" && (
              <>
                {/* What visitors get today, and why. */}
                <div className={`a-today ${activeTheme(content).name === "none" ? "" : "is-festive"}`} role="status">
                  <span className="a-label">Showing today</span>
                  <strong>{THEMES[activeTheme(content).name].label}</strong>
                  <span className="a-hint">
                    {activeTheme(content).scheduled
                      ? "From your schedule below."
                      : "Picked under Right now, as nothing is scheduled for today."}
                  </span>
                </div>

                <h2 className="a-section-title">Right now</h2>
                <div className="a-card">
                  <div className="a-card-body">
                    <SelectField
                      label="Theme when nothing is scheduled"
                      value={manualTheme(content).name}
                      options={THEME_NAMES.map((name) => ({ value: name, label: THEMES[name].label }))}
                      onChange={(name) =>
                        mutate((draft) => {
                          draft.theme = { name, message: draft.theme?.message ?? "" };
                          delete draft.snow;
                        })
                      }
                    />
                    {manualTheme(content).name !== "none" && (
                      <TextField
                        label="Banner message"
                        value={content.theme?.message ?? ""}
                        hint={`Leave empty to use: “${THEMES[manualTheme(content).name].defaultMessage}”`}
                        onChange={(message) =>
                          mutate((draft) => {
                            draft.theme = { name: manualTheme(draft).name, message };
                            delete draft.snow;
                          })
                        }
                      />
                    )}
                    <p className="a-hint">
                      Usually None. Use this for a quick switch, or use the schedule below
                      so festivals turn on and off by themselves.
                    </p>
                  </div>
                </div>

                <h2 className="a-section-title">Schedule</h2>
                <div className="a-card">
                  <div className="a-card-body">
                    <ThemeScheduleEditor
                      schedule={content.themeSchedule ?? []}
                      onChange={(schedule) =>
                        mutate((draft) => {
                          draft.themeSchedule = schedule;
                        })
                      }
                    />
                    <p className="a-hint">
                      A scheduled festival starts at midnight (India time) on its first day
                      and ends after its last day. While one is live it replaces the Right
                      now choice. If two overlap, the one that started later wins. Remember to
                      publish after adding one.
                    </p>
                  </div>
                </div>
              </>
            )}

            {area === "contact" && (
              <>
                <div className="a-card">
                  <div className="a-card-body">
                    {content.socials.map((social, index) => (
                      <div key={social.id} className="a-nested">
                        <div className="a-nested-head">
                          <strong>{SOCIAL_NAMES[social.icon] ?? social.icon}</strong>
                        </div>
                        <TextField
                          label="Link"
                          value={social.href}
                          hint={SOCIAL_HINTS[social.icon]}
                          onChange={(href) =>
                            mutate((draft) => {
                              draft.socials[index].href = href;
                            })
                          }
                        />
                        <TextField
                          label="Description for screen readers"
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
                    {/* The site credit is fixed in code (SiteFooter), so it's
                        shown here for reference only. */}
                    <div className="a-locked">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                      <div>
                        <span className="a-label">Site credit</span>
                        <p>Designed &amp; built by Nikhil Dubey</p>
                        <p className="a-hint">This line is locked and can&apos;t be changed here.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {area === "settings" && (
              <>
                <div className="a-card">
                  <div className="a-card-body">
                    <MascotNameField
                      name={content.mascot?.name ?? DEFAULT_MASCOT_NAME}
                      onRename={(name) => mutate((draft) => renameMascot(draft, name))}
                    />
                  </div>
                </div>
                <div className="a-card">
                  <div className="a-card-body">
                    <CheckboxField
                      label="Use the custom lime cursor on computers"
                      checked={content.cursor.enabled}
                      onChange={(enabled) =>
                        mutate((draft) => {
                          draft.cursor.enabled = enabled;
                        })
                      }
                    />
                  </div>
                </div>
                <div className="a-card a-card-plain">
                  <div className="a-card-body">
                    <p className="a-hint">
                      Publishing saves to the <code>{siteConfig.repo.branch}</code> branch on
                      GitHub, which rebuilds the live site in about a minute.
                    </p>
                    <a className="a-btn a-btn-quiet a-btn-sm" href={actionsUrl()} target="_blank" rel="noopener noreferrer">
                      Watch the site update ↗
                    </a>
                  </div>
                </div>
              </>
            )}
          </main>

          <section className="a-preview" aria-label="Live preview" data-tour="preview">
            <div className="a-preview-bar">
              <span className="a-preview-label">Live preview</span>
              <div className="a-segmented" role="group" aria-label="Preview size">
                {(["desktop", "phone"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={device === d ? "is-active" : ""}
                    aria-pressed={device === d}
                    onClick={() => setDevice(d)}
                  >
                    {d === "desktop" ? "Desktop" : "Phone"}
                  </button>
                ))}
              </div>
            </div>
            <PreviewFrame content={previewContent} device={device} focus={previewFocus} />
          </section>
        </div>

        {/* Phones: switch between editing and the preview. */}
        <div className="a-mobile-switch a-segmented" role="group" aria-label="Show">
          {(["editor", "preview"] as const).map((view) => (
            <button
              key={view}
              type="button"
              className={mobileView === view ? "is-active" : ""}
              aria-pressed={mobileView === view}
              onClick={() => {
                setMobileView(view);
                if (view === "preview") setDevice("phone");
              }}
            >
              {view === "editor" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>

        <AdminHelp
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onStartTour={() => {
            setHelpOpen(false);
            setMobileView("editor");
            setTourOpen(true);
          }}
        />
        <AdminTour open={tourOpen} onClose={() => setTourOpen(false)} />
      </div>
    </UploadProvider>
  );
}

const SOCIAL_NAMES: Record<string, string> = {
  phone: "Phone",
  instagram: "Instagram",
  envelope: "Email",
  location: "Map location",
};

const SOCIAL_HINTS: Record<string, string> = {
  phone: "Start with tel: and the number, like tel:+919203636803",
  envelope: "Start with mailto: and the address",
  instagram: "Your Instagram profile link",
  location: "A Google Maps share link",
};

/** Small line icons for the editor's menu. */
function AreaIcon({ id }: { id: AreaId }) {
  const paths: Record<AreaId, React.ReactNode> = {
    header: <path d="M4 5h16v6H4zM4 15h10M4 19h7" />,
    sections: <path d="M4 4h16v5H4zM4 12h7v8H4zM14 12h6v8h-6z" />,
    info: <path d="M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />,
    festival: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" />,
    contact: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
    settings: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2 .3-1.5-1.5L16.8 4l-3-1-1 2h-1.6l-1-2-3 1 .3 2.3L6 7.8 4 7.5 3 10.5l2 1v1.6l-2 1 1 3 2.3-.3 1.5 1.5L7.5 20l3 1 1-2h1.6l1 2 3-1-.3-2.3 1.5-1.5 2.2.3 1-3-2-1z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[id]}
    </svg>
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
    <div className="a-shell a-login-page">
      <div className="a-login-art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/venue/courts-night.webp" alt="" />
        <div className="a-login-art-text">
          <p>Sync Pickleball Club &amp; Café</p>
          <h2>Keep the site as lively as the courts.</h2>
        </div>
      </div>

      <div className="a-login-side">
        <div className="a-login-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="a-login-logo" src="/assets/logo.png" alt="" />
          <h1>Sync site editor</h1>

          {configured ? (
            <>
              <p>Sign in with an approved Google account to change text, photos and more.</p>
              {status.message && <p className={`a-pill a-pill-${status.tone}`}>{status.message}</p>}
              <GoogleSignInButton onToken={onToken} />
              <details className="a-login-help">
                <summary>Trouble signing in?</summary>
                <p>
                  Only approved accounts can sign in. If the Google button shows an
                  error, this web address isn&apos;t allowed in the club&apos;s Google Cloud
                  settings yet. The editor at <strong>cms.syncpickleball.com/admin</strong> always works.
                </p>
              </details>
            </>
          ) : (
            <>
              <p>The editor isn&apos;t connected to Google Sign-In on this copy of the site.</p>
              <div className="a-setup">
                <strong>For the site owner</strong>
                <ol>
                  <li>Copy <code>.env.local.example</code> to <code>.env.local</code> and fill in the three values.</li>
                  <li>Restart <code>npm run dev</code>.</li>
                  <li>Make sure this address is an authorised JavaScript origin in Google Cloud.</li>
                </ol>
                <p>The full steps are in the repository&rsquo;s <code>README.md</code>.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
