# Admin publish worker

A small Cloudflare Worker that does the two things this static site cannot do
in the browser:

1. **Verify who signed in.** The admin panel uses Google Sign-In, and a Google
   ID token can be verified with only Google's public keys — no secret needed.
   This Worker does that verification itself (RS256, via Web Crypto) rather
   than trusting whatever the browser claims.
2. **Commit on their behalf.** A verified Google identity has no GitHub
   permissions of its own. This Worker holds a GitHub token scoped to just
   this repo and is the only thing that ever uses it — after checking the
   verified email against an allow-list.

It stores nothing between requests and runs comfortably inside Cloudflare's
free tier.

## Deploy

```bash
cd oauth-worker

# 1. Edit wrangler.toml:
#    - GOOGLE_CLIENT_ID  -> your Google OAuth Web client id
#    - ALLOWED_ORIGINS   -> origins allowed to call /publish
#    - ADMIN_EMAILS      -> Google accounts allowed to publish

# 2. Store the GitHub token (never commit it). Use a fine-grained PAT scoped
#    to ONLY this repo, with "Contents: Read and write" permission:
#    https://github.com/settings/personal-access-tokens/new
npx wrangler secret put GITHUB_TOKEN

# 3. Ship it.
npx wrangler deploy
```

Wrangler prints a URL like
`https://sync-pickleball-oauth.<your-subdomain>.workers.dev` — that's the
`PUBLISH_URL` repository variable, and the Worker's `/publish` endpoint lives
at `<that-url>/publish`.

## Checking it works

A request from a disallowed origin must be rejected:

```bash
curl -i -X POST https://sync-pickleball-oauth.<subdomain>.workers.dev/publish \
  -H "Origin: https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"idToken":"x","files":[],"message":"test"}'
# expect: 403 {"error":"origin_not_allowed"}
```

A request with a garbage token from an allowed origin must fail verification,
not authorization — confirming the token is actually checked:

```bash
curl -i -X POST https://sync-pickleball-oauth.<subdomain>.workers.dev/publish \
  -H "Origin: https://cms.syncpickleball.com" \
  -H "Content-Type: application/json" \
  -d '{"idToken":"not.a.token","files":[{"path":"x","base64":"eA=="}],"message":"test"}'
# expect: 401 {"error":"unauthenticated", ...}
```

Full setup walkthrough: [`../README.md`](../README.md).
