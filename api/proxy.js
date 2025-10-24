export default async function handler(req, res) {
  try {
    const baseUrl = 'https://into-me-i-see-app-97c44441.base44.app';
    const path = req.query.path || '';
    const targetUrl = `${baseUrl}${path}${req.url.replace('/api/proxy?path=', '')}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': req.headers['accept'] || '*/*',
      },
    });

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
}
