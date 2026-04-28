export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + token
  };

  try {
    // GET — obtener quinielas del usuario
    if (req.method === 'GET') {
      const { action } = req.query;

      if (action === 'mis-quinielas') {
        const res2 = await fetch(SUPABASE_URL + '/rest/v1/quinielas?select=*,quiniela_participantes(count)&creador_id=eq.' + req.query.user_id + '&order=created_at.desc', { headers });
        const data = await res2.json();
        return res.status(200).json(data);
      }

      if (action === 'participando') {
        const res2 = await fetch(SUPABASE_URL + '/rest/v1/quiniela_participantes?select=*,quinielas(*)&user_id=eq.' + req.query.user_id, { headers });
        const data = await res2.json();
        return res.status(200).json(data);
      }

      if (action === 'detalle') {
        const res2 = await fetch(SUPABASE_URL + '/rest/v1/quinielas?select=*,quiniela_participantes(*)&id=eq.' + req.query.id, { headers });
        const data = await res2.json();
        return res.status(200).json(data[0] || null);
      }

      return res.status(400).json({ error: 'Action required' });
    }

    // POST — crear quiniela
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'crear') {
        const { quiniela, user_id } = req.body;

        // Crear quiniela
        const createRes = await fetch(SUPABASE_URL + '/rest/v1/quinielas', {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            nombre: quiniela.nombre,
            descripcion: quiniela.descripcion || '',
            color: quiniela.color || '#1A3FA8',
            liga_id: quiniela.liga_id,
            liga_nombre: quiniela.liga_nombre,
            modo: quiniela.modo || '1x2',
            pts_acierto: quiniela.pts_acierto || 3,
            pts_exacto: quiniela.pts_exacto || 2,
            bomba_activo: quiniela.bomba_activo || false,
            cierre_tipo: quiniela.cierre_tipo || 'inicio',
            cierre_minutos: quiniela.cierre_minutos || 0,
            aviso_email: quiniela.aviso_email || 30,
            premio_tipo: quiniela.premio_tipo || 1,
            monto_participante: quiniela.monto_participante || 0,
            privacidad: quiniela.privacidad || 'link',
            creador_id: user_id
          })
        });
        const createData = await createRes.json();
        if (createData.error) return res.status(400).json({ error: createData.error.message });

        const nuevaQuiniela = Array.isArray(createData) ? createData[0] : createData;

        // Agregar creador como participante
        await fetch(SUPABASE_URL + '/rest/v1/quiniela_participantes', {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ quiniela_id: nuevaQuiniela.id, user_id: user_id })
        });

        return res.status(200).json(nuevaQuiniela);
      }

      if (action === 'unirse') {
        const { quiniela_id, user_id } = req.body;
        const joinRes = await fetch(SUPABASE_URL + '/rest/v1/quiniela_participantes', {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ quiniela_id, user_id })
        });
        const joinData = await joinRes.json();
        if (joinData.error) return res.status(400).json({ error: joinData.error.message });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Action required' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
