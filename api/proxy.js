const BASE = "https://into-me-i-see-app-97c44441.base44.app";

export default async function handler(req, res) {
  try {
    const rawPath = req.query.path || "/";
    const qs = req.url.includes("?") ? "?" + req.url.split("?").slice(1).join("?") : "";
    const target = `${BASE}${rawPath}${qs}`;

    // Basic logging (check Vercel → Runtime Logs)
    console.log("→ proxying to:", target);

    const upstream = await fetch(target, {
      headers: {
        // forward useful headers
        "User-Agent": req.headers["user-agent"] || "",
        "Accept": req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "",
        "Referer": `https://${req.headers.host || ""}/`
      }
    });

    if (!upstream.ok) {
      // surface the exact upstream status to help us debug
      res.status(upstream.status).send(`Upstream error ${upstream.status}`);
      return;
    }

    // content-type + short cache for html, longer for assets
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", type);

    const isAsset = /^text\/|javascript|css|image|font|json/.test(type) && !/html/i.test(type);
    res.setHeader("Cache-Control", isAsset ? "public, max-age=300" : "public, max-age=0, must-revalidate");

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(buf);
  } catch (err) {
    console.error("proxy_failed", err);
    res.status(500).json({ error: "proxy_failed", message: String(err) });
  }
}
