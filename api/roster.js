const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await supabase
    .from('players')
    .select('id, num, name, role')
    .eq('active', true)
    .order('num');

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ players: data });
};
