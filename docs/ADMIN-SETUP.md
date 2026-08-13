# Admin setup

One-time wiring so you can edit the site at
`https://www.syncpickleball.com/admin/`.

Budget about 15 minutes. You need a GitHub account with push access to this
repo, and a free Cloudflare account.

---

## How it works

There is no database and no server holding your content. **The repo is the
database.**

```
  /admin  ──edit──▶  content/site.json  ──commit──▶  GitHub Actions
                     public/uploads/*                      │
                                                           ▼
                                                  builds ./out ──▶ GitHub Pages
```

When you hit **Publish**, the browser commits your changes straight to `main`
using your GitHub identity. That push triggers the build workflow, which
re-renders the site and deploys it. Changes are live in roughly 60–90 seconds.

Because every page is pre-rendered at build time, search engines still see
complete HTML — the content is *in* the page, not fetched by JavaScript.

The single exception to "no server" is a tiny Cloudflare Worker. GitHub's OAuth
token endpoint needs the client secret and refuses cross-origin browser calls,
so that one step has to happen off-browser. The Worker does nothing else and
stores nothing.

---

## Step 1 — Switch GitHub Pages to Actions

**Do this at the same time you merge to `main`, or the site will 404.** The old
setup served `index.html` from the branch root; that file is gone now, replaced
by a build.

Settings → Pages → **Source: GitHub Actions**.

Leave the custom domain as `www.syncpickleball.com`. It is preserved by
`public/CNAME`, which the build copies into the output.

## Step 2 — Create the GitHub OAuth App

<https://github.com/settings/developers> → **New OAuth App**

| Field | Value |
| --- | --- |
| Application name | `Sync Pickleball Admin` |
| Homepage URL | `https://www.syncpickleball.com` |
| Authorization callback URL | `https://www.syncpickleball.com/admin/callback/` |

The trailing slash on the callback URL matters — the site is built with
`trailingSlash: true`, and GitHub matches this string exactly.

Then **Generate a new client secret**. Copy both the **Client ID** and the
**secret**; the secret is shown only once.

> Register a *separate* OAuth App for local development, with callback URL
> `http://localhost:3000/admin/callback/`. GitHub allows one callback URL per
> app.

## Step 3 — Deploy the OAuth Worker

```bash
cd oauth-worker
```

Edit `wrangler.toml` and set `GITHUB_CLIENT_ID` to your client ID.

```bash
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_SECRET   # paste the secret
npx wrangler deploy
```

Copy the URL it prints, e.g.
`https://sync-pickleball-oauth.your-name.workers.dev`.

## Step 4 — Add the repository variables

Settings → Secrets and variables → **Actions** → **Variables** tab → New
repository variable:

| Name | Value |
| --- | --- |
| `OAUTH_CLIENT_ID` | your OAuth App client ID |
| `OAUTH_PROXY_URL` | the Worker URL from step 3 |
| `ADMIN_USERS` | `Acronikhil` (comma-separate to add more editors) |

These are **variables, not secrets**. They get compiled into the public
JavaScript bundle, which is fine — a client ID is public by design. Never put
the client *secret* here.

## Step 5 — Build and check

Actions → **Deploy site** → **Run workflow**.

When it finishes, open `https://www.syncpickleball.com/admin/` and sign in with
GitHub. Make a small edit and publish it to confirm the loop works end to end.

---

## Using the editor

- **Text** — every heading, paragraph, and button label has a field.
- **Images** — *Replace image* on any image. Uploads are automatically
  downscaled to 1600px wide and re-encoded as JPEG before being committed, so
  the repo doesn't balloon.
- **Sections** — reorder with ↑ ↓, duplicate with ⧉, delete with ✕, or add a
  new *Wide card*, *Three cards*, or *Call to action* at the bottom.
- **Headings** with mixed weights use a mini-format: a newline becomes a line
  break, and `_underscores_` make text lighter. So
  `Pro Shop,\n_On Point_` renders as **Pro Shop,** / *On Point*.
- **Live preview** on the right updates as you type. Nothing is committed until
  you press **Publish**.

Unpublished edits are kept in your browser, so a refresh will not lose text
changes. Queued image uploads live only in memory — publish before closing the
tab.

### Publishing

**Publish** writes `content/site.json` plus any new images as a **single
commit**, so one edit session is one deploy. The status bar links to the Actions
run.

If someone published from another device while your editor was open, you get a
warning before you overwrite their work.

---

## Access control

Two independent gates:

1. `ADMIN_USERS` — a convenience check on the GitHub username.
2. **GitHub itself** — this is the real boundary. The token is scoped to
   `public_repo`, and GitHub rejects any commit from an account without push
   access. Someone who bypassed the first check still could not write anything.

Your access token is held in `sessionStorage` and disappears when you close the
tab. That is deliberate: a token that can write to your repo shouldn't sit on
disk. Signing back in is one click.

**If the repo is ever made private**, change `NEXT_PUBLIC_OAUTH_SCOPE` to `repo`
in the workflow — `public_repo` cannot see private repositories. (Note that
Pages on a private repo requires a paid plan.)

---

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

To exercise the admin panel locally, create `.env.local` using the dev OAuth App
from step 2:

```
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_dev_client_id
NEXT_PUBLIC_OAUTH_PROXY_URL=https://sync-pickleball-oauth.your-name.workers.dev
NEXT_PUBLIC_ADMIN_USERS=Acronikhil
```

`http://localhost:3000` is already on the Worker's allow-list in
`wrangler.toml`. Remove it once you no longer need local admin access.

Note that publishing from localhost commits to the **real** `main` branch —
there is no separate staging content. To experiment safely, point
`NEXT_PUBLIC_REPO_BRANCH` at a scratch branch.

---

## Troubleshooting

**"The editor is not connected to GitHub yet"** — `OAUTH_CLIENT_ID` or
`OAUTH_PROXY_URL` is missing, or the workflow hasn't re-run since you added
them. These are baked in at build time, so a rebuild is required.

**"Login state did not match"** — the login was started in a different tab or
the session expired. Start again from `/admin/`.

**`origin_not_allowed` from the Worker** — the site's origin is not in
`ALLOWED_ORIGINS` in `wrangler.toml`. Update it and redeploy the Worker.

**"No access" after signing in** — the account is missing from `ADMIN_USERS`, or
it genuinely lacks push access to the repo.

**Publish succeeds but the site looks unchanged** — check the Actions run. Also
give it ~90 seconds and hard-refresh; GitHub Pages edge-caches aggressively.

**Site 404s after merging to `main`** — GitHub Pages is still set to "Deploy
from a branch". Step 1.
