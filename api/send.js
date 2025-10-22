import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json");

  const { title = "Into-Me-I-See", body = "Hello from IMIS!", url = "/" } = req.body || {};

  try {
    const { data = [], error } = await supabase.from("push_subscriptions").select("*");
    if (error) throw error;

    if (!data.length) {
      return res.status(200).json({ sent: 0, cleaned: 0, note: "No subscribers yet" });
    }

    const payload = JSON.stringify({ title, body, data: { url } });

    const results = await Promise.allSettled(
      data.map((row) =>
        webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload
        )
      )
    );

    const expired = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const sc = r.reason?.statusCode;
        // 410 Gone, 404 Not Found, 403/401 unauthorized are typical “dead subscription”
        if (sc === 410 || sc === 404 || sc === 403 || sc === 401) {
          expired.push(data[i].endpoint);
        }
      }
    });

    if (expired.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", expired);
    }

    return res.status(200).json({ sent: results.length, cleaned: expired.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
