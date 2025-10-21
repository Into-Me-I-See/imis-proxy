import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const sub = req.body; // { endpoint, keys: { p256dh, auth } }
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: "Bad subscription object" });
    }
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        { onConflict: "endpoint" }
      );
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
