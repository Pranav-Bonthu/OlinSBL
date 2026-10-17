# Olin Suite Basketball League

Bracket, box scores, 2K-style player cards, per-11 leaderboards and highlights for the Olin Suite Basketball League.

- `public/index.html`: the whole site (no build step).
- `api/league.js`: reads and saves the league data (one JSON document in Postgres).
- `api/auth.js`: checks the editor code.
- `api/_seed.js`: starting data, loaded into the database the first time the site runs.

## Deploy on Vercel

1. Import this repo at vercel.com/new (Framework preset: **Other**, no build command).
2. In the project, open **Storage → Create Database → Neon (Postgres)** and connect it to the project. This adds `DATABASE_URL`.
3. Redeploy. The first visit creates the table and loads the starting data.

Optional: add an `EDITOR_PASSCODE` environment variable to require a code before anyone can edit. Without it, anyone can edit.

## Editing

Anyone can view and edit (unless `EDITOR_PASSCODE` is set, in which case editors press **Editor login** first). Open a game to update the score (tap the scoreboard), tap a player card to enter stats or change a photo, or open a team to change its logo. Changes save for everyone immediately.

Every save keeps the previous version in the `osbl_history` table (last 200), so a bad edit can be rolled back from the Neon console.
