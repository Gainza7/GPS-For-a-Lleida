const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Sin contraseña: cualquiera con el enlace puede entrar a subir sesiones.
  // (El acceso a los datos privados de los jugadores sigue protegido con PIN aparte.)
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.status(200).json({ token });
};
