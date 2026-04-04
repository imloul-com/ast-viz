# Cloudflare Single-Domain Deployment

This repo is now ready for declarative Cloudflare deployment from GitHub.

## What was added

- Root `wrangler.toml` for this app.
- GitHub Actions workflow at `.github/workflows/deploy-cloudflare-pages.yml`.

## 1) Configure GitHub secrets

In this repository, add:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token should allow Cloudflare Pages + Workers deploy access for your account.

## 2) Deploy this app automatically

Push to `main`.

The workflow runs:

1. `npm ci`
2. `npm run build`
3. `wrangler pages deploy dist --project-name <wrangler.toml[name]> --branch main`

This gives you a deployable Cloudflare Pages project named `<wrangler.toml[name]>`.

## 3) Mount this app on your single domain

Use a separate router-worker repository with your own Worker code.

Set your real domain in the route:

- `pattern = "example.com/*"`
- `zone_name = "example.com"`

The included route maps:

- `https://example.com/ast-viz/*` -> this app (`ast-viz`)

Prefix stripping should be handled in your router-worker code, so this app does not need a Vite `base` rewrite.

## 4) DNS requirement

Your domain must be proxied by Cloudflare (orange cloud), otherwise Worker routes will not match.

## Optional local deploy commands

From this repo:

- `npm run cf:deploy`
- `npm run cf:deploy:prod`
