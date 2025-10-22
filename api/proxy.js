export default async function handler(req, res) {
  try {
    const base = 'https://into-me-i-see-app-97c444d1.base44.app'; // <- your Base44 app host
    const url = new URL(req.url, 'http://local');
    const path = url.searchParams.get('path') || '';
    const target = `${base}/${path.replace(/^\/+/, '')}`;

    const upstream = await fetch(target, {
      headers: {
        // Forward relevant headers if you want, but it's optional
        'accept': 'application/javascript, */*;q=0.1',
      },
      redirect: 'follow',
    });

    const status = upstream.status;
    const buf = Buffer.from(await upstream.arrayBuffer());

    // Force correct MIME for JS
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    // Helpful cache for static bundles (Base44 fingerprints)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    return res.status(status).send(buf);
  } catch (e) {
    res.status(502).json({ error: 'proxy_failed', detail: String(e) });
  }
}
