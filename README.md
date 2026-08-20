# Sync Pickleball — editable site

The [Sync Pickleball](https://www.syncpickleball.com) website, rebuilt as a
Next.js app with a built-in admin editor. Every heading, paragraph, image,
button and section is editable from the browser at `/admin`, and publishing
commits the change back to this repo, which rebuilds and redeploys the site.

Deployed to GitHub Pages at **https://cms.syncpickleball.com**.

> **Relationship to the original repo.** `Acronikhil/Sync-Pickleball` still
> serves the live site at `www.syncpickleball.com` and is completely
> independent of this one. Nothing here writes to it. Content edited through
> this admin panel is committed *here* and appears on the `cms.` subdomain
> only, until you decide to switch the main domain over
> ([see below](#promoting-this-to-the-main-domain)).

---

## Contents

- [How it works](#how-it-works)
- [Production setup](#production-setup) — the full checklist
- [Verifying the deployment](#verifying-the-deployment)
- [Using the editor](#using-the-editor)
- [Promoting this to the main domain](#promoting-this-to-the-main-domain)
- [Local development](#local-development)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## How it works

There is no database and no application server. **The repo is the database.**

```
  /admin  ──edit──▶  content/site.json   ──commit──▶  GitHub Actions
                     public/uploads/*                       │
                                                            ▼
                                                   builds ./out ──▶ GitHub Pages
```

Pressing **Publish** commits your changes straight to `main` using your own
GitHub identity. That push triggers the build workflow, which re-renders the
site and deploys it. Changes are live in roughly 60–90 seconds.

Because the pages are pre-rendered at build time, crawlers and social previews
get complete HTML — nothing is fetched client-side, so SEO is unaffected.

Signing in is **Google**, not GitHub — but a Google identity carries no
permission to write to this repo on its own. So there is one small server
piece: a Cloudflare Worker that verifies the signed-in Google account, checks
it against an allow-list, and only then commits on its behalf using a GitHub
token that the Worker alone holds. Nothing else in the system can write to the
repo. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#security-model) for the
full security model.

---

## Production setup

Roughly 30 minutes end to end, most of it waiting for DNS and TLS. Do the steps
in order — later ones depend on URLs produced by earlier ones.

You need: push access to this repo, DNS control for `syncpickleball.com`, a free
Cloudflare account, and a Google account to sign in with.

### 1. Create the GitHub repo and push

Create a new **public** repository at <https://github.com/new> named
`sync-pickleball-next`. Do **not** initialise it with a README, `.gitignore` or
licence — this repo already has them.

Then, from this folder:

```bash
git remote -v                 # should already show sync-pickleball-next
git push -u origin main
```

> Keep the repo **public**. GitHub Pages on a private repo requires a paid plan.
> (The admin panel's own reads are unauthenticated either way — see
> [How it works](#how-it-works) — but a private repo needs Pages on a paid
> plan regardless.)

### 2. Point DNS at GitHub Pages

At your DNS provider, add one record:

| Type | Name | Value | Proxy |
| --- | --- | --- | --- |
| `CNAME` | `cms` | `acronikhil.github.io` | **DNS only** — not proxied |

The value has no `https://` and no path. If your DNS is on Cloudflare, the
record **must** be grey-cloud (DNS only); orange-cloud proxying breaks GitHub's
certificate issuance.

Check it has propagated before continuing:

```bash
nslookup cms.syncpickleball.com
```

### 3. Turn on GitHub Pages

In the new repo: **Settings → Pages**

- **Source:** `GitHub Actions` (not "Deploy from a branch")
- **Custom domain:** `cms.syncpickleball.com` → Save

GitHub then provisions a TLS certificate, which takes a few minutes. Once it
finishes, tick **Enforce HTTPS**.

> The custom domain is also carried by [`public/CNAME`](public/CNAME), which the
> build copies into the output. **Don't delete that file** — without it, every
> deploy would reset the domain.

### 4. Create a Google OAuth client id

<https://console.cloud.google.com/> → create a new project (any name, e.g.
`Sync Pickleball Admin`).

**APIs & Services → OAuth consent screen**

- User type: **External**
- App name / support email / developer email: fill in with your own details
- Scopes: leave as default — "Sign in with Google" only needs the built-in
  `openid`, `email` and `profile` scopes
- **Test users:** add every Google account that should be able to publish
  (e.g. your own Gmail). While the app is unpublished/"Testing" — which is
  fine indefinitely for personal use — only accounts on this list can sign in,
  and Google never requires app verification for it.

**APIs & Services → Credentials → Create Credentials → OAuth client ID**

| Field | Value |
| --- | --- |
| Application type | `Web application` |
| Name | `Sync Pickleball Admin Web` |
| Authorized JavaScript origins | `https://cms.syncpickleball.com` and `http://localhost:3000` |
| Authorized redirect URIs | *(leave empty — Google Sign-In runs in-page, no redirect)* |

Copy the **Client ID** (ends in `.apps.googleusercontent.com`). There is no
client secret to copy — this flow doesn't use one.

### 5. Create a GitHub token and deploy the Worker

The Worker needs a GitHub credential of its own to commit with, since a Google
sign-in proves identity but grants no GitHub permission. Create one scoped to
**only this repo**:

<https://github.com/settings/personal-access-tokens/new> (fine-grained, not
classic)

| Field | Value |
| --- | --- |
| Token name | `sync-pickleball-next admin worker` |
| Resource owner | your account |
| Repository access | **Only select repositories** → `sync-pickleball-next` |
| Permissions | **Contents: Read and write** |
| Expiration | 1 year (fine-grained tokens can't be set to never expire — put a reminder in your calendar to rotate it; publishing will start failing with a clear 401 when it lapses) |

Generate it and copy the token — shown once.

Then deploy the Worker:

```bash
cd oauth-worker
```

Open [`wrangler.toml`](oauth-worker/wrangler.toml) and set `GOOGLE_CLIENT_ID`
(from step 4) and `ADMIN_EMAILS` (the Google account(s) allowed to publish —
must match what you added as test users). `ALLOWED_ORIGINS` and the repo
details are already filled in.

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN    # paste the fine-grained token
npx wrangler deploy
```

Copy the URL it prints, e.g.
`https://sync-pickleball-oauth.your-name.workers.dev` — that's the
`PUBLISH_URL` value for the next step (the Worker's actual endpoint is
`<that-url>/publish`; the app appends `/publish` itself).

### 6. Add the repository variables

**Settings → Secrets and variables → Actions → _Variables_ tab** → *New
repository variable*, four times:

| Name | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | the client ID from step 4 |
| `PUBLISH_URL` | the Worker URL from step 5 |
| `ADMIN_EMAILS` | your Gmail address (comma-separate to add more editors) |
| `SITE_URL` | `https://cms.syncpickleball.com` |

These are **variables, not secrets** — they're compiled into the public
JavaScript bundle, which is correct: a Google client ID is public by design,
and `ADMIN_EMAILS` here is only a convenience check for the UI (the Worker
holds its own copy and is what actually enforces it — see
[the security model](docs/ARCHITECTURE.md#security-model)).

`ALLOW_INDEXING` is deliberately left unset. See
[search indexing](#search-indexing) below.

### 7. Build and deploy

**Actions → Deploy site → Run workflow.**

Every later deploy is automatic: any push to `main` — including one made by the
admin panel — triggers it.

---

## Verifying the deployment

Work through these before calling it done.

```bash
# 1. Site is served over HTTPS
curl -sI https://cms.syncpickleball.com | head -1          # expect: HTTP/2 200

# 2. Content is in the HTML, not fetched by JS (this is what SEO depends on)
curl -s https://cms.syncpickleball.com | grep -c "Serve, Sip, and Socialize"   # expect: 1

# 3. Crawlers are turned away while this duplicates www
curl -s https://cms.syncpickleball.com/robots.txt          # expect: Disallow: /

# 4. Admin is reachable
curl -sI https://cms.syncpickleball.com/admin/ | head -1   # expect: HTTP/2 200

# 5. The Worker rejects origins that aren't yours
curl -s -X POST https://sync-pickleball-oauth.<your>.workers.dev/publish \
  -H "Origin: https://example.com" -H "Content-Type: application/json" \
  -d '{"idToken":"x","files":[],"message":"test"}'          # expect: origin_not_allowed
```

Then in a browser:

1. Open `https://cms.syncpickleball.com` — it should be indistinguishable from
   the live site.
2. Open `https://cms.syncpickleball.com/admin/` and click **Sign in with
   Google**. Only accounts added as test users in step 4 will be offered
   sign-in successfully.
3. Change one word, watch the live preview update, and press **Publish**.
4. Follow the Actions link in the status bar; when it goes green, hard-refresh
   the public page and confirm the change is there.

If step 3 succeeds, the whole loop works — Google verified who you are, the
Worker checked you against its allow-list and committed on your behalf, and
that commit triggered the rebuild.

### Search indexing

This subdomain serves the *same content* as `www.syncpickleball.com`. Two
indexed copies of one page compete with each other, and Google decides which
wins — possibly not the one you want.

So indexing is **off by default**: `robots.txt` disallows everything and every
page carries `noindex`. That is controlled by the `ALLOW_INDEXING` repository
variable, which you should leave unset until this site *replaces* www.

---

## Using the editor

<https://cms.syncpickleball.com/admin/>

- **Text** — every heading, paragraph and button label has a field.
- **Images** — *Replace image* on any image. Uploads are downscaled to 1600px
  wide and re-encoded as JPEG in your browser before being committed, so the
  repo doesn't balloon.
- **Sections** — reorder with ↑ ↓, duplicate with ⧉, delete with ✕, or add a
  new *Wide card*, *Three cards*, or *Call to action*.
- **Live preview** on the right renders through the same components as
  production, so what you see is what deploys.
- **Headings with mixed weights** use a mini-format: a newline is a line break,
  and `_underscores_` make text lighter. `Pro Shop,` + newline + `_On Point_`
  renders as **Pro Shop,** above a lighter *On Point*.

Nothing is committed until you press **Publish**, which writes `site.json` plus
any new images as a **single commit** — one editing session, one deploy.

Unpublished text edits are kept in your browser, so a refresh won't lose them.
Queued image uploads live only in memory — publish before closing the tab.

Editing [`content/site.json`](content/site.json) by hand and pushing works
exactly the same way; the admin panel is a convenience, not a requirement.

### Who can edit

Two independent gates:

1. `ADMIN_EMAILS` in the app — a convenience check that produces a clear "no
   access" message in the UI.
2. **`ADMIN_EMAILS` in the Worker** — the real boundary. Every publish sends
   the Worker a Google ID token; the Worker verifies its signature itself and
   only commits if the verified email is on its own copy of the allow-list.
   Someone who got past the first check still couldn't write anything, because
   the Worker holds the only GitHub credential in the system.

The two lists must be kept in sync by hand — update `ADMIN_EMAILS` in both the
repository variables (step 6) and `oauth-worker/wrangler.toml` (step 5) — and
also add new editors as Google Cloud test users (step 4), or they won't be able
to sign in at all.

The Google ID token is held in `sessionStorage` and vanishes when the tab
closes; it also expires on its own after about an hour, at which point
publishing will ask you to sign in again.

---

## Promoting this to the main domain

When you're ready for this to *be* `www.syncpickleball.com`:

1. In the old `Sync-Pickleball` repo: **Settings → Pages → remove the custom
   domain**. (Leave the repo itself alone — it stays as a rollback.)
2. Here: **Settings → Pages → Custom domain** → `www.syncpickleball.com`, and
   update [`public/CNAME`](public/CNAME) to match.
3. Confirm DNS has `www` pointing at `acronikhil.github.io` (it likely already
   does).
4. Add `https://www.syncpickleball.com` as an Authorized JavaScript origin on
   the Google OAuth client (Google Cloud Console → Credentials → your client →
   Authorized JavaScript origins).
5. Add the new origin to `ALLOWED_ORIGINS` in
   [`oauth-worker/wrangler.toml`](oauth-worker/wrangler.toml) and
   `npx wrangler deploy`.
6. Set repository variables `SITE_URL` = `https://www.syncpickleball.com` and
   `ALLOW_INDEXING` = `true`.
7. Re-run the deploy workflow.

Step 6 is what switches indexing on, points canonical URLs and schema.org at
the real domain, and replaces the blanket `Disallow` with a real `robots.txt`
and sitemap.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to ./out
npm run typecheck
```

To use the admin panel locally, `http://localhost:3000` is already an
Authorized JavaScript origin on the Google OAuth client from step 4 and is
already in the Worker's `ALLOWED_ORIGINS`. Create `.env.local`:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_PUBLISH_URL=https://sync-pickleball-oauth.your-name.workers.dev
NEXT_PUBLIC_ADMIN_EMAILS=you@gmail.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Publishing from localhost commits to the **real** `main` branch — there is no
> separate staging content. To experiment safely, set
> `NEXT_PUBLIC_REPO_BRANCH` to a scratch branch.

---

## Project structure

| Path | Purpose |
| --- | --- |
| `content/site.json` | All editable text, images, links and section order |
| `lib/content.ts` | The content schema — add a field here to make it editable |
| `app/page.tsx`, `components/` | Renders that JSON into the page at build time |
| `app/admin/` | The editor UI |
| `lib/github.ts` | Unauthenticated reads of the public repo |
| `lib/auth.ts` | Google Sign-In in the browser |
| `lib/publish.ts` | Calls the Worker to commit changes |
| `lib/image.ts` | Downscales uploads before they're committed |
| `oauth-worker/` | Verifies Google sign-in and commits via a GitHub token |
| `.github/workflows/deploy.yml` | Builds to `./out`, deploys to Pages |
| `public/booking/` | Earlier booking prototype, kept as-is |

### Booking

[`public/booking/`](public/booking/) is the earlier booking prototype, carried
over untouched and reachable at `/booking/booking.html`. Its API calls are all
commented out; bookings currently go through Hudle, linked from the Book Now
buttons.

---

## Troubleshooting

**Site 404s after the first deploy** — Pages source is still "Deploy from a
branch". Set it to **GitHub Actions** (step 3).

**Custom domain keeps resetting** — [`public/CNAME`](public/CNAME) was deleted.
It must contain exactly `cms.syncpickleball.com`.

**"Enforce HTTPS" is greyed out** — the certificate hasn't been issued yet.
Usually DNS: confirm the `CNAME` record resolves and, on Cloudflare, that it is
DNS-only rather than proxied.

**"The editor is not connected to Google Sign-In yet"** — `GOOGLE_CLIENT_ID` or
`PUBLISH_URL` is missing, or the workflow hasn't re-run since you added them.
They're baked in at build time, so a rebuild is required.

**Google's sign-in popup shows "access blocked" / account not offered** — the
account isn't on the OAuth consent screen's **Test users** list (Google Cloud
Console → APIs & Services → OAuth consent screen). Unpublished apps only allow
sign-in for accounts explicitly listed there.

**`origin_not_allowed` from the Worker** — the site's origin isn't in
`ALLOWED_ORIGINS` in `wrangler.toml`, or isn't an Authorized JavaScript origin
on the Google OAuth client. Update both and `npx wrangler deploy`.

**"No access" after signing in** — the email isn't in `ADMIN_EMAILS` in the
app's repository variable. Check the Worker's own `ADMIN_EMAILS` in
`wrangler.toml` too — that copy is what actually decides whether a publish
succeeds.

**"Your sign-in expired"** — Google ID tokens last about an hour. Sign in
again; there's nothing to configure here, it's expected behaviour.

**Publish succeeds but the page looks unchanged** — check the Actions run
first. Otherwise give it ~90 seconds and hard-refresh; Pages edge-caches
aggressively.

**Publish fails with `publish_failed` / 502** — the Worker's `GITHUB_TOKEN`
secret is missing, wrong, or has expired (fine-grained tokens max out at one
year — see step 5). Generate a new one and
`npx wrangler secret put GITHUB_TOKEN`.

How it all fits together, and how to extend it:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## License

[MIT](LICENSE)
