export default async function handler(req, res) {
  const BASE = 'https://into-me-i-see-app-97c44441.base44.app';

  const url = new URL(req.url, 'http://local');
  const raw = url.searchParams.get('path') || '/';
  const q = url.searchParams.get('q');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const target = `${BASE}${path}${q ? `?${q}` : ''}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        'user-agent': req.headers['user-agent'] || '',
        'accept': req.headers['accept'] || '*/*'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).send(`Upstream error ${upstream.status}`);
      return;
    }

    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.setHeader('cache-control', 'public, max-age=300');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch {
    res.status(500).json({ error: 'proxy_failed' });
  }
}
