# AST Visualizer

A small tool for writing Ohm grammars and inspecting parse output.

## What it does

- Edit grammar in code (`/grammar/code`)
- Load built-in grammar examples
- Parse input and inspect AST (`/visualize`)
- Switch between tree and JSON views
- View rule dependency graph and suggestions

## Local development

Requirements:
- Node.js `20.19+` or `22.12+`
- npm

Run:

```bash
git clone <repository-url>
cd ast-viz
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Deployment

This repo is deployment-agnostic:

- `.github/workflows/deploy-cloudflare-pages.yml` builds and publishes a versioned static artifact to GHCR.
- Cloudflare deployment is orchestrated from `cloudflare-infra`.

Routing/domain ownership note:
- This repo only builds the app artifact.
- Domain routing, path mounts, and cross-app infra are managed in `cloudflare-infra`.

## Notes

Ohm naming convention:
- Uppercase rule names are structural and appear in the tree.
- Lowercase rule names are lexical/token-level.

## License

MIT
