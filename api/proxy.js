export default async function handler(req, res) {
  try {
    const base = "https://into-me-i-see-app-97c444d1.base44.app";
    const path = req.query.path || "";
    const url = `${base}/${path}`;

    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    return res.status(r.status).send(buf);
  } catch (e) {
    res.status(500).json({ error: "proxy_failed", detail: String(e) });
  }
}
