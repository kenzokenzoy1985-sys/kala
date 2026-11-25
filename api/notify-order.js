export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatIds = process.env.TELEGRAM_CHAT_ID;
  if (!token || !rawChatIds) {
    return res.status(500).json({ error: 'Telegram env not configured' });
  }

  const { orderId, customerName, customerPhone, customerAddress, items = [], subtotal = 0, discount = 0, total = 0, promoCode, proofBase64 } = req.body || {};
  const fmt = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
  const esc = (s) => String(s || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = items.map((it) => {
    const col = it.color ? ` | Warna: ${esc(it.color)}` : '';
    return `• ${esc(it.name)} (Size: ${esc(it.size)}${col}) x${it.quantity} — ${fmt(it.price * it.quantity)}`;
  }).join('\n');

  const text = [
    '🛍️ <b>ORDER BARU — WS.STORE (QRIS)</b>',
    '━━━━━━━━━━━━━━━━━━',
    `🆔 Order: <code>${esc(orderId)}</code>`,
    `👤 Nama: ${esc(customerName)}`,
    `📱 HP/WA: ${esc(customerPhone)}`,
    `📍 Alamat: ${esc(customerAddress)}`,
    '',
    '📦 <b>Pesanan:</b>',
    lines || '-',
    '',
    `💰 Subtotal: ${fmt(subtotal)}`,
    discount > 0 ? `🏷️ Diskon (${esc(promoCode || 'PROMO')}): -${fmt(discount)}` : null,
    `💳 <b>TOTAL BAYAR: ${fmt(total)}</b>`,
    '━━━━━━━━━━━━━━━━━━',
    '⚡ Cek mutasi GoPay Merchant / QRIS lo sekarang!'
  ].filter((v) => v !== null).join('\n');

  const chatIds = rawChatIds.split(',').map((c) => c.trim()).filter(Boolean);
  let sent = false;

  for (const chatId of chatIds) {
    try {
      let ok = false;
      if (proofBase64 && typeof proofBase64 === 'string' && proofBase64.startsWith('data:image/') && text.length < 1000) {
        const match = proofBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const buf = Buffer.from(match[2], 'base64');
          const form = new FormData();
          form.append('chat_id', chatId);
          form.append('caption', text);
          form.append('parse_mode', 'HTML');
          form.append('photo', new Blob([buf], { type: match[1] }), 'bukti-transfer.jpg');
          const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form });
          ok = r.ok;
        }
      }
      if (!ok) {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });
        ok = r.ok;
      }
      if (ok) sent = true;
    } catch (err) {
      console.error('Telegram error:', err);
    }
  }

  return res.status(200).json({ ok: sent });
}
