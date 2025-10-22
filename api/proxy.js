export const config = { runtime: "edge" };

const APP = "https://app.into-me-i-see.ca";

function rewriteAssets(html) {
  let out = html
    .replaceAll(/(<script[^>]+src=["'])\/([^"']+\.js)(["'][^>]*>)/g, `$1${APP}/$2$3`)
    .replaceAll(/(<link[^>]+href=["'])\/([^"']+\.css)(["'][^>]*>)/g, `$1${APP}/$2$3`);

  out = out
    .replaceAll(/https:\/\/[a-z0-9.-]*base44\.app\/([^"'<>]+\.js)/g, `${APP}/$1`)
    .replaceAll(/https:\/\/[a-z0-9.-]*base44\.app\/([^"'<>]+\.css)/g, `${APP}/$1`);

  return out;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const upstream = await fetch(APP + url.pathname + url.search, {
    headers: { "user-agent": req.headers.get("user-agent") || "" }
  });
  const ct = upstream.headers.get("content-type") || "";
  if (!ct.includes("text/html")) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers
    });
  }
  const html = await upstream.text();
  const rewritten = rewriteAssets(html);
  const headers = new Headers(upstream.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("content-length");
  return new Response(rewritten, { status: upstream.status, headers });
}
