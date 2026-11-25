import { useState, useEffect } from 'react';
import { Package, RefreshCw, Save, Eye, X, Check } from 'lucide-react';

interface AdminOrder {
  id: string;
  order_code?: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  customer_address: string;
  items: { name: string; size: string; color?: string; quantity: number; price: number }[];
  total: number;
  proof_url?: string;
  status: string;
  courier?: string;
  tracking_number?: string;
  shipping_estimate?: string;
}

interface AdminOrdersSectionProps {
  supabase: any;
  formatRupiah: (amount: number) => string;
}

export function AdminOrdersSection({ supabase, formatRupiah }: AdminOrdersSectionProps) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { status: string; courier: string; tracking_number: string; shipping_estimate: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewProof, setPreviewProof] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      const list = (data as AdminOrder[]) || [];
      setOrders(list);
      const initial: Record<string, { status: string; courier: string; tracking_number: string; shipping_estimate: string }> = {};
      list.forEach((o) => {
        initial[o.id] = {
          status: o.status || 'pending',
          courier: o.courier || '',
          tracking_number: o.tracking_number || '',
          shipping_estimate: o.shipping_estimate || 'Estimasi dikirim dalam 1x24 jam setelah konfirmasi',
        };
      });
      setDrafts(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSave = async (orderId: string) => {
    if (!supabase || !drafts[orderId]) return;
    setSavingId(orderId);
    try {
      const d = drafts[orderId];
      const { error } = await supabase
        .from('orders')
        .update({
          status: d.status,
          courier: d.courier.trim() || null,
          tracking_number: d.tracking_number.trim() || null,
          shipping_estimate: d.shipping_estimate.trim() || null,
        })
        .eq('id', orderId);
      if (error) throw error;
      setSavedId(orderId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan update pesanan.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="col-span-full bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-neutral-900" />
          <h2 className="text-base sm:text-lg font-bold text-neutral-900">
            Pesanan Masuk ({orders.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <p className="text-xs text-neutral-500 py-6 text-center">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="text-xs text-neutral-500 py-6 text-center">Belum ada pesanan QRIS masuk.</p>
      ) : (
        <div className="divide-y divide-neutral-200 mt-2">
          {orders.map((order) => {
            const d = drafts[order.id] || { status: order.status, courier: '', tracking_number: '', shipping_estimate: '' };
            const code = order.order_code || ('#' + order.id.slice(0, 6).toUpperCase());
            return (
              <div key={order.id} className="py-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{code}</span>
                      <span className="text-[11px] text-neutral-500">
                        {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 mt-0.5">
                      <strong>{order.customer_name}</strong> ({order.customer_phone || '-'}) — {order.customer_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{formatRupiah(order.total)}</span>
                    {order.proof_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewProof(order.proof_url || null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-800"
                      >
                        <Eye className="w-3.5 h-3.5" /> Bukti TF
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-2.5 text-xs text-neutral-700 space-y-1">
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {it.name} (Size {it.size}{it.color ? `, ${it.color}` : ''}) × {it.quantity}</span>
                      <span className="font-medium">{formatRupiah(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Status Pesanan</label>
                    <select
                      value={d.status}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, status: e.target.value } }))}
                      className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                    >
                      <option value="pending">Menunggu Konfirmasi</option>
                      <option value="packed">Sedang Dikemas</option>
                      <option value="shipped">Dalam Pengiriman</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Jadwal / Estimasi Kirim</label>
                    <input
                      type="text"
                      value={d.shipping_estimate}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, shipping_estimate: e.target.value } }))}
                      placeholder="Misal: Dikirim hari ini jam 17.00"
                      className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Kurir</label>
                    <input
                      type="text"
                      value={d.courier}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, courier: e.target.value } }))}
                      placeholder="J&T / JNE / SiCepat"
                      className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] font-medium text-neutral-600 mb-1">No. Resi</label>
                      <input
                        type="text"
                        value={d.tracking_number}
                        onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, tracking_number: e.target.value } }))}
                        placeholder="Nomor resi..."
                        className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={savingId === order.id}
                      onClick={() => handleSave(order.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition shrink-0"
                    >
                      {savedId === order.id ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Oke</> : <><Save className="w-3.5 h-3.5" /> Simpan</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewProof(null)}>
          <div className="relative max-w-md w-full bg-white rounded-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewProof(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <img src={previewProof} alt="Bukti Transfer" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
