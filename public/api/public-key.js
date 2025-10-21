export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY });
}
