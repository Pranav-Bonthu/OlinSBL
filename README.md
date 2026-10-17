# Olin Suite Basketball League

Bracket, box scores, 2K-style player cards, per-11 leaderboards and highlights for the Olin Suite Basketball League.

- `public/index.html`: the whole site (no build step).
- `api/league.js`: reads and saves the league data (one JSON document in Postgres).
- `api/auth.js`: checks the editor code.
- `api/_seed.js`: starting data, loaded into the database the first time the site runs.

## Deploy on Vercel

1. Import this repo at vercel.com/new (Framework preset: **Other**, no build command).
2. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it to the project. This adds `DATABASE_URL`.
3. In **Settings → Environment Variables**, add `EDITOR_PASSCODE` with the code editors will type.
4. Redeploy. The first visit creates the table and loads the starting data.

## Editing

Anyone can view. Press **Editor login**, enter the editor code, then open a game to update the score (tap the scoreboard), tap a player card to enter stats or change a photo, or open a team to change its logo. Changes save for everyone immediately.

To change the editor code, update `EDITOR_PASSCODE` in Vercel and redeploy. Everyone logged in with the old code is logged out on their next save.
