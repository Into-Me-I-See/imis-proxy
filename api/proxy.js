const BASE = 'https://into-me-i-see-app-97c44441.base44.app';

export default async function handler(req, res) {
  try {
    const raw = (req.query?.path || '/').toString();
    const target = new URL(raw.startsWith('/') ? raw : `/${raw}`, BASE);

    const qidx = req.url.indexOf('?');
    if (qidx !== -1) {
      const qs = req.url.slice(qidx + 1);
      if (qs) target.search = qs;
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        'user-agent': req.headers['user-agent'] || '',
        'accept': req.headers['accept'] || '*/*',
      },
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
  } catch (err) {
    res.status(500).json({ error: 'proxy_failed', message: String(err?.message || err) });
  }
}
