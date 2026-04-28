export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = new URLSearchParams(req.query);
  const endpoint = params.get('endpoint');
  params.delete('endpoint');

  if (!endpoint) {
    return res.status(400).json({ error: 'Falta el parametro endpoint' });
  }

  const apiUrl = `https://v3.football.api-sports.io/${endpoint}?${params.toString()}`;

  try {
    const apiRes = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY,
      },
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `API error: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
