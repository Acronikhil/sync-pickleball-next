# Architecture

How this site is put together, and how to extend it.

For setup and deployment steps, see the [README](../README.md). This document is
for when you need to *change* something.

---

## The shape of the problem

GitHub Pages serves static files. There is no server, no API routes, no
sessions, no database. But the site needs an admin who can log in and change
content, and those changes must survive and reach production.

The resolution: **the git repo is the database.**

- Content lives in [`content/site.json`](../content/site.json).
- The public page is rendered from that file **at build time**, so visitors and
  crawlers receive complete HTML.
- The admin panel edits that file **in the browser** and commits it back through
  the GitHub API.
- The commit triggers a rebuild, which regenerates the HTML.

The alternative — a hosted database queried by the browser — was rejected
because it would render the marketing copy client-side, which is exactly the
content that needs to be visible to search engines.

### The one piece that isn't static

OAuth's final step exchanges a temporary code for an access token. It requires
the client secret, and GitHub's token endpoint sends no CORS headers, so a
browser cannot perform it — not "should not", *cannot*.

[`oauth-worker/`](../oauth-worker/) is a ~90-line Cloudflare Worker that does
only that exchange. It holds the secret, checks the request origin against an
allow-list, and returns the token. It stores nothing.

---

## Request flows

**A visitor:**

```
GET / ──▶ GitHub Pages ──▶ pre-rendered index.html
```

No JavaScript is required to read the page. The client bundle only adds the
scroll animations and the cursor effect.

**An admin publishing:**

```
/admin  ──▶ GitHub OAuth ──▶ /admin/callback ──▶ Worker ──▶ access token
                                                              │
   edit ──▶ Publish ──▶ Git Data API (blobs → tree → commit → ref)
                                                              │
                                          push to main ──▶ Actions ──▶ Pages
```

Publishing uses the **Git Data API** rather than the simpler Contents API
because a session may change `site.json` *and* add several images. The Contents
API writes one file per commit, which would mean one Actions run and one deploy
per file. The Git Data API builds a single tree and a single commit, so an
editing session produces exactly one deploy.

See [`lib/github.ts`](../lib/github.ts).

### Concurrent edits

Before committing, the admin re-reads the blob SHA of `site.json` and compares
it to the SHA read when the editor loaded. If they differ, someone published
from elsewhere in the meantime and the admin is asked whether to overwrite.

This is a warning, not a lock. Two people editing simultaneously is out of scope
for a single-admin site.

---

## The content model

[`lib/content.ts`](../lib/content.ts) is the schema, and it is the file to start
from when changing what's editable. The renderer and the admin editor are both
built from these types, so the compiler will point you at every place that needs
updating.

```
SiteContent
├── hero      HeroSection          logo, heading, body, buttons[]
├── sections  BodySection[]        ← add/remove/reorder happens here
│   ├── FeatureSection             image, imageSide, title, body, buttons[]
│   ├── TrioSection                cards[] { image, title, body }
│   └── CtaSection                 heading, body, buttons[]
├── socials   SocialLink[]         icon, href, label
├── footer    FooterContent        copyright, credit
└── cursor                         enabled, image
```

The hero is editable but deliberately **not** reorderable — it carries the logo
and sets up the page. The `sections` array is where the admin adds, duplicates,
reorders and deletes.

### Mini rich-text format

Some headings mix font weights inside a single string — *"Indoor **Comfort,**"*
is half light. Rather than expose a raw HTML box to the admin, two rules apply
to heading fields:

| Input | Output |
| --- | --- |
| newline | line break |
| `_text_` | lighter weight |

`formatRichText()` parses this into tokens, and
[`components/RichText.tsx`](../components/RichText.tsx) builds React nodes from
them. Nothing is ever passed through `dangerouslySetInnerHTML`, so admin text
cannot inject markup or script into the page.

---

## Extending it

### Add a field to an existing section

Say feature sections need an optional caption under the image.

1. **Schema** — add it to `FeatureSection` in `lib/content.ts`:

   ```ts
   export interface FeatureSection {
     // …
     caption?: string;
   }
   ```

2. **Render** — use it in
   [`components/sections/Feature.tsx`](../components/sections/Feature.tsx).

3. **Edit** — add a field to `FeatureFields` in
   [`components/admin/SectionEditor.tsx`](../components/admin/SectionEditor.tsx):

   ```tsx
   <TextField
     label="Caption"
     value={section.caption ?? ""}
     onChange={(caption) => onChange({ ...section, caption })}
   />
   ```

4. **Seed** — optionally add it to existing sections in `content/site.json`.

Making the field optional (`?`) means existing content stays valid, so no
migration is needed.

### Add a new section type

1. Define the interface in `lib/content.ts` and add it to the `BodySection`
   union. The compiler now flags every incomplete `switch`.
2. Add a case to `createSection()` returning a sensible blank section.
3. Build the renderer in `components/sections/` and add a case to
   `renderSection()` in
   [`components/SiteRenderer.tsx`](../components/SiteRenderer.tsx).
4. Add a fields component and a case in `SectionEditor`, plus a label in
   `SECTION_LABELS` and a branch in `summarise()`.
5. Add a button to the "Add a section" row in
   [`app/admin/page.tsx`](../app/admin/page.tsx).

### Make the SEO metadata editable

Currently the title, description, keywords and schema.org block are hardcoded in
[`app/layout.tsx`](../app/layout.tsx). To move them into the CMS, add a `seo`
object to `SiteContent`, read it in `layout.tsx` via `lib/site-content.ts`, and
add a corresponding card in the admin. Nothing structural stands in the way — it
was left out only because it wasn't requested.

---

## Images

Uploads go through [`lib/image.ts`](../lib/image.ts) before they are committed:
drawn to a canvas, capped at 1600px wide, re-encoded as JPEG at quality 0.82,
and flattened onto white so transparent PNGs don't turn black.

This matters because uploads live in git forever. The original `pickleball.png`
in this repo is 2 MB on its own; a handful of unprocessed phone photos would
dwarf the entire history.

Files land in `public/uploads/` and are referenced as `/uploads/<name>.jpg`.
While an upload is queued but unpublished, the admin preview substitutes the
in-memory data URL — see `withPreviews()` in `app/admin/page.tsx`.

---

## Styling

The original stylesheet is ported nearly verbatim into
[`app/globals.css`](../app/globals.css), with one deliberate change: the bare
element selectors (`h1`, `p`, `section`, `footer`, `iframe`) are scoped under
`.site-root`.

Those rules are opinionated enough — gradient-filled text, `max-width: 60vw` on
paragraphs — to wreck the admin UI, which shares the same stylesheet. The public
page and the admin's live preview both render inside `.site-root`; admin chrome
sits outside it and uses `a-`-prefixed classes.

That scoping is what lets the preview use the *same* components as production
rather than an approximation of them.

---

## Security model

**Authentication** is GitHub OAuth. **Authorisation** is GitHub itself: the
token carries the `public_repo` scope, and GitHub rejects writes from any account
without push access. The `ADMIN_USERS` list is a convenience check that produces
a clear "no access" message — it is not the boundary, and it is not relied upon.

**Tokens** live in `sessionStorage`, so they are gone when the tab closes. A
token that can write to the repo shouldn't persist on disk.

**The client secret** exists only as a Cloudflare Worker secret. Everything
compiled into the site bundle — client ID, proxy URL, repo name, admin list — is
public by design.

**The Worker's origin allow-list** stops another site from using your proxy to
mint tokens against your OAuth app.

**Admin-authored content** is rendered as React nodes, never as raw HTML, so a
careless or compromised admin cannot inject script into the public page.

### What this does not defend against

An attacker who compromises the admin's GitHub account can change the site — but
they could do that by pushing to the repo anyway; the admin panel adds no new
exposure. Enable 2FA on the GitHub account; that is the meaningful control.

---

## Deployment

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds on any
push to `main` and deploys the `./out` export to Pages.

Two details worth knowing:

- **`concurrency: pages` with `cancel-in-progress`** — publishing twice in quick
  succession supersedes the first build rather than queueing behind it.
- **`public/.nojekyll`** — without it, GitHub Pages runs Jekyll, which strips
  directories beginning with an underscore. That would delete `_next/`, i.e.
  every stylesheet and script on the site.

`public/CNAME` carries the custom domain into the build output; deleting it
resets the domain on the next deploy.
