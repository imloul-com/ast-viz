# Deployment ownership

This repository is infra-agnostic.

- It builds app artifacts in CI (`.github/workflows/deploy-cloudflare-pages.yml`).
- It publishes static build artifacts to GHCR (`ghcr.io/anasimloul/ast-viz-static`) using version tags (`prod-latest`, `dev-latest`, `sha-*`).
- It does not deploy to Cloudflare directly.
- It does not require Cloudflare secrets.

Cloudflare Pages deployment, router deployment, and route/domain mapping are managed in the `cloudflare-infra` repository from the app catalog (`worker/src/app-sources.json`).
