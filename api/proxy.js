export default async function handler(req, res) {
  try {
    const base = 'https://into-me-i-see-app-97c44441.base44.app';
    const url = req.url.replace(/^\/api\/proxy\?path=/, '');
    const target = `${base}${url.startsWith('/') ? url : '/' + url}`;

    const upstream = await fetch(target, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': req.headers['accept'] || '*/*'
      }
    });

    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);

    const buf = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(buf));
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'proxy_failed', message: err.message });
  }
}
