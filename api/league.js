// GET  /api/league  -> { version, data }   (public)
// POST /api/league  -> save; needs header x-editor-key and body { version, data }
//                      409 with the latest { version, data } if someone saved first.
import { sql, ensureTable, editorKeyOk } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`select version, data from osbl_league where id = 1`;
      return res.status(200).json(rows[0]);
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
      const rows = await sql`update osbl_league
                             set data = ${JSON.stringify(data)}::jsonb, version = version + 1, updated_at = now()
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
