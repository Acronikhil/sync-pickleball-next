# OAuth proxy

A ~90-line Cloudflare Worker that does the one thing a static site cannot: swap
a GitHub OAuth code for an access token, using the client secret.

It is the only server component in this project, it stores nothing, and it runs
comfortably inside Cloudflare's free tier.

## Deploy

```bash
cd oauth-worker

# 1. Put your OAuth App's client id in wrangler.toml, and set the origins
#    allowed to use this proxy.

# 2. Store the client secret (never commit it).
npx wrangler secret put GITHUB_CLIENT_SECRET

# 3. Ship it.
npx wrangler deploy
```

Wrangler prints a URL like
`https://sync-pickleball-oauth.<your-subdomain>.workers.dev` — that is the value
for the `OAUTH_PROXY_URL` repository variable.

## Checking it works

A request from a disallowed origin must be rejected:

```bash
curl -i -X POST https://sync-pickleball-oauth.<subdomain>.workers.dev \
  -H "Origin: https://example.com" \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
# expect: 403 {"error":"origin_not_allowed"}
```

Full setup walkthrough: [`../README.md`](../README.md).
