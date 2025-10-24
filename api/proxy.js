export default async function handler(req, res) {
  try {
    // Base44 app URL
    const base = 'https://into-me-i-see-app-97c44441.base44.app';

    // Clean path
    const rawPath = req.query.path || '/';
    const query = req.url.split('?').slice(1).join('?'); // preserve querystring
    const target = `${base}${rawPath}${query ? '?' + query : ''}`;

    console.log('→ proxying to:', target);

    // Fetch remote asset
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
        'Accept': req.headers['accept'] || '*/*'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).send(`Upstream error ${upstream.status}`);
      return;
    }

    // Copy headers
    const type = upstream.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=300');

    // Stream body
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (err) {
    console.error('Proxy crash:', err);
    res.status(500).json({
      error: 'proxy_failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
