const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { playerId, pin } = req.body || {};
  if (!playerId || !pin) return res.status(400).json({ error: 'Faltan datos' });

  const { data: player, error } = await supabase
    .from('players')
    .select('id, name, role, num, pin_hash, failed_attempts, locked_until')
    .eq('id', playerId)
    .single();

  if (error || !player) return res.status(404).json({ error: 'Jugador no encontrado' });

  if (player.locked_until && new Date(player.locked_until) > new Date()) {
    return res.status(423).json({ error: 'Casilla bloqueada temporalmente. Inténtalo más tarde.' });
  }

  const valid = await bcrypt.compare(String(pin), player.pin_hash);

  if (!valid) {
    const attempts = (player.failed_attempts || 0) + 1;
    const update = { failed_attempts: attempts };
    if (attempts >= MAX_ATTEMPTS) {
      update.locked_until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
      update.failed_attempts = 0;
    }
    await supabase.from('players').update(update).eq('id', playerId);
    return res.status(401).json({
      error: 'PIN incorrecto',
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts)
    });
  }

  // PIN correcto: reseteamos intentos fallidos y generamos el token de sesión
  await supabase.from('players').update({ failed_attempts: 0, locked_until: null }).eq('id', playerId);

  const token = jwt.sign(
    { playerId: player.id },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(200).json({
    token,
    player: { id: player.id, name: player.name, role: player.role, num: player.num }
  });
};
