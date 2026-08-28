const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function requireAdmin(req){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req)) return res.status(401).json({ error: 'No autorizado' });

  const { sessionName, sessionDate, entries } = req.body || {};
  if (!sessionName || !sessionDate || !Array.isArray(entries) || entries.length === 0){
    return res.status(400).json({ error: 'Faltan datos de la sesión' });
  }

  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({ name: sessionName, session_date: sessionDate })
    .select()
    .single();
  if (sessErr) return res.status(500).json({ error: sessErr.message });

  const rows = entries.map(e => ({
    player_id: e.playerId,
    session_id: session.id,
    duration: e.duration,
    movement_level: e.movementLevel,
    muscular_load: e.muscularLoad,
    coi_hi: e.coiHI || null
  }));

  const { error: metricsErr } = await supabase.from('player_session_metrics').insert(rows);
  if (metricsErr) return res.status(500).json({ error: metricsErr.message });

  res.status(200).json({ ok: true, sessionId: session.id, playersSaved: rows.length });
};
