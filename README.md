# dheep-port-2026

Standalone Nuxt portfolio. All application data and assets are contained in this folder; the repository does not need a parent `data` folder or Laravel to render the portfolio and Spotify widget.

## Run locally

Use Node.js 22 or newer. Run `npm ci`, then `npm run dev`. The frontend runs on `http://127.0.0.1:3030`.

Edit `data/profile.json` and `data/projects.json` to update portfolio content. In the full workspace, run `npm run sync:projects` from its parent directory to synchronize the Laravel project data.

## Vercel deployment

When this folder is pushed as the entire Git repository, set Vercel's **Root Directory** to the repository root (`./`), **Framework Preset** to **Nuxt**, and **Build Command** to `npm run build`. Leave the output directory at the framework default. `vercel.json` supplies the framework and build command. Nuxt's server routes must remain enabled for Spotify; do not deploy as a static export.

Add these server-only Environment Variables in Vercel, using the values from your local `.env`:

- `NUXT_SPOTIFY_CLIENT_ID`
- `NUXT_SPOTIFY_CLIENT_SECRET`
- `NUXT_SPOTIFY_REFRESH_TOKEN`

Do not commit `.env` or use a `NUXT_PUBLIC_` prefix for secrets. Rebuild/redeploy after changing hosting environment variables.

`NUXT_API_BASE` is optional. Leave it unset if Laravel is not deployed: projects use local JSON and the contact form reports that the service is unavailable. To enable contact submissions, deploy Laravel separately and set `NUXT_API_BASE` to its HTTPS API URL. Do not use `127.0.0.1:8000` in Vercel.

## Spotify account setup

For a new connection, fill `NUXT_SPOTIFY_CLIENT_ID` and `NUXT_SPOTIFY_CLIENT_SECRET` in your local `.env` and register `http://127.0.0.1:8989/callback` in Spotify Developer Dashboard. Run `npm run spotify:connect`, open the printed authorization URL, and authorize your account. The helper saves `NUXT_SPOTIFY_REFRESH_TOKEN` privately in `.env`; restart the dev server. An already connected account can use its existing refresh token in Vercel without signing in again.

Visitors see the owner's current track without logging in. Only track metadata is exposed; Spotify credentials remain in Nuxt's server runtime configuration.

## Checks

FOREKS uses an authentic screenshot of the repository's public homepage rendered locally at 1280 × 800. Dashboard workflows require a separate API and have not been verified end-to-end. No deployment URL is provided, so the project has only a GitHub link.

- `npm run build`
- `npm run test:spotify` (mocked Spotify service tests)
- `npm run test:e2e` (Chrome required; local dev server must be running)
