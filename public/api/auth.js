export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, username, country } = req.body;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    if (action === 'register') {
      // Crear usuario
      const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password })
      });
      const signUpData = await signUpRes.json();
      if (signUpData.error) return res.status(400).json({ error: signUpData.error.message });

      // Crear perfil
      if (signUpData.user) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${signUpData.access_token}`
          },
          body: JSON.stringify({ id: signUpData.user.id, username, country: country || 'México' })
        });
      }
      return res.status(200).json({ user: signUpData.user, session: signUpData });
    }

    if (action === 'login') {
      const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      if (loginData.error) return res.status(400).json({ error: loginData.error.message });
      return res.status(200).json(loginData);
    }

    if (action === 'profile') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
      const profileData = await profileRes.json();
      return res.status(200).json(profileData[0] || null);
    }

    return res.status(400).json({ error: 'Action not supported' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
