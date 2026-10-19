// GET  /api/league  -> { version, data }   (public)
// POST /api/league  -> save; needs header x-editor-key and body { version, data }
//                      409 with the latest { version, data } if someone saved first.
import { sql, ensureTable, editorKeyOk } from './_db.js';
import { migrate } from './_bracket.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`select version, data from osbl_league where id = 1`;
      const cur = rows[0];
      // One-time upgrade to the current bracket format. The old version goes to history.
      const next = migrate(cur.data);
      if (next) {
        await sql`insert into osbl_history (version, data) values (${cur.version}, ${JSON.stringify(cur.data)}::jsonb)
                  on conflict (version) do nothing`;
        const up = await sql`update osbl_league
                             set data = ${JSON.stringify(next)}::jsonb, version = version + 1, updated_at = now()
                             where id = 1 and version = ${cur.version}
                             returning version, data`;
        if (up.length) return res.status(200).json(up[0]);
        const again = await sql`select version, data from osbl_league where id = 1`;
        return res.status(200).json(again[0]);
      }
      return res.status(200).json(cur);
    }

    if (req.method === 'POST') {
      if (!editorKeyOk(req.headers['x-editor-key'])) {
        return res.status(401).json({ error: 'Wrong editor code.' });
      }
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      const { version, data } = body || {};
      if (!Number.isInteger(version) || !data || !Array.isArray(data.teams) || !Array.isArray(data.games)) {
        return res.status(400).json({ error: 'That save was malformed.' });
      }
      // A tab opened before the format change could send old-format data; upgrade it too.
      const upgraded = migrate(data);
      const toSave = upgraded || data;
      // Keep a copy of the version being replaced (last 200 kept) so edits can be undone.
      await sql`insert into osbl_history (version, data)
                select version, data from osbl_league where id = 1 and version = ${version}
                on conflict (version) do nothing`;
      await sql`delete from osbl_history where version < ${version - 200}`;
      const rows = await sql`update osbl_league
                             set data = ${JSON.stringify(toSave)}::jsonb, version = version + 1, updated_at = now()
                             where id = 1 and version = ${version}
                             returning version`;
      if (!rows.length) {
        const cur = await sql`select version, data from osbl_league where id = 1`;
        return res.status(409).json(cur[0]);
      }
      return res.status(200).json({ version: rows[0].version });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + (err && err.message ? err.message : String(err)) });
  }
}
