/* Aviso de pagamento enviado pela InfinitePay (webhook). Sempre confirmado com a própria InfinitePay. */
import { json } from "../lib/lib.mjs";
import { confirmar } from "../lib/pagamento.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: true });
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    const r = await confirmar({ order_nsu: b.order_nsu, transaction_nsu: b.transaction_nsu, slug: b.invoice_slug || b.slug, receipt_url: b.receipt_url });
    return json(r, r.ok ? 200 : 400);
  } catch (e) {
    console.error("webhook:", e.message);
    return json({ ok: false }, 500); // a InfinitePay tenta de novo
  }
};
export const config = { path: "/api/infinitepay" };
