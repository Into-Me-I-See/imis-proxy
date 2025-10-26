const BASE = 'https://into-me-i-see-app-97c44441.base44.app';
const LONG_CACHE_EXT = /\.(js|mjs|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i;

export default async function handler(req, res) {
  try {
    const qpath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
    const rawPath = qpath ?? req.url.replace(/^\/api\/proxy/, '') || '/';
    const target = new URL(`${BASE}${rawPath}`);

    const fwdHeaders = {
      'user-agent': req.headers['user-agent'] || '',
      'accept': req.headers['accept'] || '*/*',
      'accept-encoding': req.headers['accept-encoding'] || '',
    };

    const upstream = await fetch(target, {
      method: 'GET',
      headers: fwdHeaders,
      redirect: 'manual',
    });

    if (upstream.status >= 300 && upstream.status < 400 && upstream.headers.get('location')) {
      const loc = upstream.headers.get('location');
      const newLoc = rewriteLocation(loc);
      res.status(upstream.status).setHeader('Location', newLoc);
      safeCaching(res, loc);
      return res.end();
    }

    if (!upstream.ok) {
      res.status(upstream.status);
      const ct = upstream.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      stripSecurityHeaders(res);
      safeCaching(res, target.pathname);
      return res.send(`Upstream error ${upstream.status}`);
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    stripSecurityHeaders(res);
    safeCaching(res, target.pathname, contentType);

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (err) {
    console.error('Proxy crash:', err);
    res.status(500).json({
      error: 'proxy_failed',
      message: err?.message || 'unexpected error',
    });
  }
}

function rewriteLocation(loc) {
  try {
    const u = new URL(loc, BASE);
    return u.pathname + (u.search || '');
  } catch {
    return '/';
  }
}

function stripSecurityHeaders(res) {
  [
    'x-frame-options',
    'content-security-policy',
    'content-security-policy-report-only',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
    'cross-origin-resource-policy',
    'referrer-policy',
  ].forEach((h) => res.removeHeader(h));
}

function safeCaching(res, path, contentType) {
  const isLong = LONG_CACHE_EXT.test(path || '') ||
                 (contentType && /(?:javascript|css|image|font)/i.test(contentType));
  if (isLong) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
}
