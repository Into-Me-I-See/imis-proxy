export default async function handler(req, res) {
  try {
    const base = "https://into-me-i-see-app-97c444d1.base44.app";
    const path = (req.query.path || "").replace(/^\/+/, "");
    const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
    const url = qs ? `${base}/${path}?${qs}` : `${base}/${path}`;

    const r = await fetch(url, { redirect: "follow" });
    const buf = Buffer.from(await r.arrayBuffer());

    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/octet-stream");
    res.setHeader("Cache-Control", r.headers.get("cache-control") || "public, max-age=31536000, immutable");
    return res.send(buf);
  } catch (e) {
    return res.status(500).json({ error: "proxy_failed", detail: String(e) });
  }
}

