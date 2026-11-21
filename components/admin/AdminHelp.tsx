"use client";

import { useEffect } from "react";

const TOPICS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Getting around",
    body: (
      <>
        <p>The menu on the left groups everything on the site. Click an area to open it in the middle panel.</p>
        <p>The preview on the right shows the page exactly as visitors will see it, and it updates as you type. Use the Desktop and Phone buttons above it to check both.</p>
      </>
    ),
  },
  {
    title: "Editing text",
    body: (
      <>
        <p>Type straight into any box. The preview updates right away.</p>
        <p>In headings you can press Enter to start a new line, and wrap words in underscores to show them in the fancy italic style. For example <code>Pull Up, _Hang Out_</code> shows &ldquo;Hang Out&rdquo; in italics.</p>
      </>
    ),
  },
  {
    title: "Changing photos",
    body: (
      <>
        <p>Click <strong>Replace image</strong> and pick a photo from your computer or phone. JPG, PNG, WebP, GIF and SVG all work. Photos are resized for the web automatically, and logos with a see-through background stay see-through.</p>
        <p>Photos from an iPhone are converted for you when you pick them. If one still won&apos;t upload, set the iPhone camera to Most Compatible.</p>
        <p>Fill in the <strong>Alt text</strong> with a short description of the photo, like &ldquo;Purple courts at night&rdquo;. It helps people using screen readers and helps Google understand the page.</p>
      </>
    ),
  },
  {
    title: "Page sections",
    body: (
      <>
        <p>The page is made of blocks. Open one to edit it, or use the buttons on its right to move it up or down, duplicate it or delete it.</p>
        <p>Use <strong>Add a section</strong> at the bottom to add a new block. New blocks go at the end of the page, so move them up to where you want them.</p>
      </>
    ),
  },
  {
    title: "Club info",
    body: (
      <>
        <p>Opening hours, prices, the café menu and reviews each have their own switch. Add your lines, then tick &ldquo;Show on the site&rdquo; to make that block appear.</p>
        <p>Please only add real details and real reviews. Visitors rely on them.</p>
      </>
    ),
  },
  {
    title: "Festival themes",
    body: (
      <>
        <p>Pick a festival to dress the whole site up: falling snow or confetti, decorations, a banner at the top and an outfit for the penguin.</p>
        <p>The easiest way is the <strong>Schedule</strong>: add a festival with its first and last day and the site switches to it at midnight, then back on the day after it ends. You can book a whole year ahead.</p>
        <p><strong>Right now</strong> is for a quick switch by hand. It applies whenever nothing is scheduled, so it is usually set to None.</p>
        <p>Each festival can have its own banner message, or leave it empty to use the default one.</p>
      </>
    ),
  },
  {
    title: "Publishing",
    body: (
      <>
        <p>Nothing you change goes live until you press <strong>Publish</strong>. After that the site updates in about a minute.</p>
        <p>Your edits are kept in this browser until you publish, so it is fine to close the tab and come back later. <strong>Undo changes</strong> throws away everything you haven&apos;t published yet.</p>
      </>
    ),
  },
  {
    title: "Troubleshooting",
    body: (
      <>
        <p><strong>The sign-in button shows an error.</strong> The address you are using has to be allowed in the club&apos;s Google Cloud settings. The live editor at cms.syncpickleball.com works. Ask the site owner to add any other address.</p>
        <p><strong>&ldquo;The live content changed&rdquo;.</strong> Someone published from another device since you opened the editor. Reload to get their changes first, unless you are sure yours should replace them.</p>
        <p><strong>My changes are not on the site yet.</strong> Give it a minute after publishing, then refresh the page. The Settings area has a link to watch the update happen.</p>
      </>
    ),
  },
];

/** The slide-out user guide, with a button to replay the tour. */
export function AdminHelp({
  open,
  onClose,
  onStartTour,
}: {
  open: boolean;
  onClose: () => void;
  onStartTour: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`a-drawer-backdrop ${open ? "is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`a-drawer ${open ? "is-open" : ""}`} aria-label="Help" aria-hidden={!open}>
        <div className="a-drawer-head">
          <div>
            <h2>Help</h2>
            <p>How to edit and publish the Sync site.</p>
          </div>
          <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Close help" tabIndex={open ? 0 : -1}>
            ✕
          </button>
        </div>

        <button
          type="button"
          className="a-btn a-btn-primary a-drawer-tour"
          onClick={onStartTour}
          tabIndex={open ? 0 : -1}
        >
          Take the 1 minute tour
        </button>

        <div className="a-guide">
          {TOPICS.map((topic, index) => (
            <details key={topic.title} open={index === 0}>
              <summary tabIndex={open ? 0 : -1}>{topic.title}</summary>
              <div className="a-guide-body">{topic.body}</div>
            </details>
          ))}
        </div>
      </aside>
    </>
  );
}
