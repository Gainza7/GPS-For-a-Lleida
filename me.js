const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function getPlayerIdFromToken(req){
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.playerId;
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const playerId = getPlayerIdFromToken(req);
  if (!playerId) return res.status(401).json({ error: 'No autorizado' });

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('id, name, role, num')
    .eq('id', playerId)
    .single();
  if (playerErr || !player) return res.status(404).json({ error: 'Jugador no encontrado' });

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select('id, name, session_date')
    .order('session_date');
  if (sessErr) return res.status(500).json({ error: sessErr.message });

  const { data: myMetrics, error: myErr } = await supabase
    .from('player_session_metrics')
    .select('session_id, duration, movement_level, muscular_load, coi_hi')
    .eq('player_id', playerId);
  if (myErr) return res.status(500).json({ error: myErr.message });

  const mySessionIds = myMetrics.map(m => m.session_id);

  // Media del equipo por sesión (solo para las sesiones en las que este jugador participó)
  const { data: allMetricsForMySessions, error: teamErr } = await supabase
    .from('player_session_metrics')
    .select('session_id, movement_level, muscular_load')
    .in('session_id', mySessionIds.length ? mySessionIds : [0]);
  if (teamErr) return res.status(500).json({ error: teamErr.message });

  const teamAverages = {};
  mySessionIds.forEach(sid => {
    const rows = allMetricsForMySessions.filter(r => r.session_id === sid);
    const avg = (field) => rows.reduce((a, r) => a + Number(r[field]), 0) / rows.length;
    teamAverages[sid] = {
      movementLevel: rows.length ? avg('movement_level') : null,
      muscularLoad: rows.length ? avg('muscular_load') : null
    };
  });

  const sessionsById = {};
  sessions.forEach(s => { sessionsById[s.id] = s; });

  const mySessions = myMetrics.map(m => ({
    session: sessionsById[m.session_id],
    metrics: {
      duration: m.duration,
      movementLevel: Number(m.movement_level),
      muscularLoad: Number(m.muscular_load),
      coiHI: m.coi_hi
    }
  })).filter(x => x.session);

  res.status(200).json({ player, mySessions, teamAverages });
};
