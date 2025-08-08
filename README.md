# dyad

Dyad is a local, open-source AI app builder. It's fast, private and fully under your control — like Lovable, v0, or Bolt, but running right on your machine.

![Image](https://github.com/user-attachments/assets/f6c83dfc-6ffd-4d32-93dd-4b9c46d17790)

More info at: [http://dyad.sh/](http://dyad.sh/)

## 🚀 Features

- ⚡️ **Local**: Fast, private and no lock-in.
- 🛠 **Bring your own keys**: Use your own AI API keys with no vendor lock-in.
- 🖥️ **Cross-platform**: Easy to run on Mac or Windows.

## 📦 Download

No sign-up required. Just download and go.

### [👉 Download for your platform](https://www.dyad.sh/#download)

**dyad** is open source (Apache 2.0-licensed).

If you're interested in contributing to dyad, please read our [contributing](./CONTRIBUTING.md) doc.

# Dyad

## Cloudflare Pages (web demo)

- Build: `npm run build:web` (outputs to `dist/`)
- Deploy to Cloudflare Pages and set build output directory to `dist`
- SPA routing is enabled via `public/_redirects`

Electron features are stubbed in the browser. Chat runs as a demo using localStorage.

## Automatic deploy (GitHub Actions)

- Workflow: `.github/workflows/deploy-cloudflare-pages.yml`
- Required repo secrets:
  - `CF_API_TOKEN` (Pages write token)
  - `CF_ACCOUNT_ID`
  - `CF_PAGES_PROJECT_NAME`
- Optional environment variables in Cloudflare Pages:
  - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`
  - KV binding `SETTINGS_KV` for settings persistence
