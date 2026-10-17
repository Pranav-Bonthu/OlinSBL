// POST /api/auth { key } -> 200 if the editor code is right, 401 otherwise.
import { editorKeyOk, editingOpen } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET tells the page whether editing is open to everyone.
  if (req.method === 'GET') return res.status(200).json({ open: editingOpen() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const ok = editorKeyOk(body && body.key);
  if (!ok) await new Promise(r => setTimeout(r, 600)); // slow down guessing
  return res.status(ok ? 200 : 401).json({ ok });
}
