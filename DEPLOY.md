# Deploying Portfolio Health to the web (Render)

The app is **deploy-ready**: in production the Express server builds and serves the
React site *and* the API from one service, listening on the host's `PORT`.
Config lives in [`render.yaml`](render.yaml).

You only need to do two things: **(1) push to GitHub**, **(2) connect it on Render.**

---

## Step 1 — Put the code on GitHub

You already have a local git repo with one commit. Create an empty repo on GitHub
and push to it.

1. Go to <https://github.com/new>
   - Repository name: `portfolio-health` (or anything)
   - **Private** or Public — either works
   - **Do NOT** add a README/.gitignore (the repo already has them)
   - Click **Create repository**

2. Copy the repo URL GitHub shows you, then run these in this project folder
   (`C:\Users\TONO\Downloads\Claude+TradingView`), replacing the URL:

   ```powershell
   git remote add origin https://github.com/<your-username>/portfolio-health.git
   git push -u origin main
   ```

   If GitHub asks for a password, use a **Personal Access Token** (Settings →
   Developer settings → Tokens), not your account password.

---

## Step 2 — Deploy on Render

1. Sign up / log in at <https://render.com> (you can "Sign in with GitHub").
2. Click **New +** → **Blueprint**.
3. Select your `portfolio-health` GitHub repo and approve access.
4. Render reads `render.yaml` automatically — it shows a **free web service**.
   Click **Apply** / **Create**.
5. Wait ~2–4 minutes for the first build & deploy.

When it finishes you get a live URL like:

```
https://portfolio-health.onrender.com
```

That's your public website. 🎉

> **Don't see "Blueprint"?** Use **New + → Web Service** instead, pick the repo, and set:
> - Build Command: `npm install --include=dev && npm run build`
> - Start Command: `npm start`
> - Add env var `NODE_ENV = production`
> - Plan: **Free**

---

## Good to know

- **Free tier sleeps.** After ~15 min of no traffic the service spins down; the next
  visit takes ~50s to wake up, then it's fast again. Upgrading to a paid instance
  ($7/mo) keeps it always-on.
- **Auto-deploy.** Every `git push` to `main` redeploys automatically.
- **Custom domain later.** In the Render dashboard: Settings → Custom Domains → add
  your domain and follow the DNS instructions.
- **Data source.** Quotes/charts/news come from public Yahoo Finance endpoints (no API
  key). If you ever hit rate limits under heavy traffic, swap in a keyed provider
  (Finnhub / Alpha Vantage) in [`server/index.mjs`](server/index.mjs).
