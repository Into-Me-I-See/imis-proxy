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
  if (req.method !== "POST") return res.status(405).end();

  const { title = "Into-Me-I-See", body = "Hello from IMIS!", url = "/" } = req.body || {};

  try {
    const { data = [] } = await supabase.from("push_subscriptions").select("*");

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
      if (r.status === "rejected" && r.reason?.statusCode === 410) {
        expired.push(data[i].endpoint);
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
