import { useState, useEffect } from 'react';
import { Package, RefreshCw, Save, Eye, X, Check, Phone } from 'lucide-react';

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  packed: 'Sedang Dikemas',
  shipped: 'Dalam Pengiriman',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  packed: 'bg-sky-100 text-sky-800 border-sky-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function AdminOrdersSection({ supabase, formatRupiah }: AdminOrdersSectionProps) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
        .limit(100);
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
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...d } : o)));
      setSavedId(orderId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan update pesanan.');
    } finally {
      setSavingId(null);
    }
  };

  const openWhatsAppNotify = (order: AdminOrder) => {
    const raw = (order.customer_phone || '').replace(/\D/g, '');
    if (!raw) {
      alert('Nomor HP pembeli tidak tersedia.');
      return;
    }
    const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw;
    const d = drafts[order.id] || order;
    const code = order.order_code || ('#' + order.id.slice(0, 6).toUpperCase());
    const statusText = STATUS_LABEL[d.status] || d.status;
    const msg = [
      `Halo kak *${order.customer_name}*, update pesanan *${code}* di *WS.STORE*:`,
      '',
      `• Status: *${statusText}*`,
      d.shipping_estimate ? `• Info Kirim: ${d.shipping_estimate}` : null,
      d.courier ? `• Kurir: ${d.courier}` : null,
      d.tracking_number ? `• No. Resi: *${d.tracking_number}*` : null,
      '',
      'Kakak juga bisa pantau status pesanan langsung di menu *Pesanan* di website kami. Terima kasih!'
    ].filter((v) => v !== null).join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Kelola Pesanan Masuk</h1>
            <p className="text-xs text-neutral-500">Cek bukti bayar, update status pengiriman, dan input nomor resi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: `Semua (${orders.length})` },
          { key: 'pending', label: 'Menunggu' },
          { key: 'packed', label: 'Dikemas' },
          { key: 'shipped', label: 'Dikirim' },
          { key: 'completed', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${filterStatus === tab.key ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-sm text-neutral-500">
          Memuat daftar pesanan...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-2">
          <Package className="w-9 h-9 text-neutral-300 mx-auto" />
          <p className="text-sm font-medium text-neutral-600">Belum ada pesanan di kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const d = drafts[order.id] || { status: order.status, courier: '', tracking_number: '', shipping_estimate: '' };
            const code = order.order_code || ('#' + order.id.slice(0, 6).toUpperCase());
            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-neutral-900">{code}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 mt-1.5">
                      <strong>{order.customer_name}</strong> • {order.customer_phone || '-'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{order.customer_address}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <p className="text-[11px] text-neutral-400">Total Bayar</p>
                      <p className="font-bold text-base text-neutral-900">{formatRupiah(order.total)}</p>
                    </div>
                    {order.proof_url && (
                      <button
                        type="button"
                        onClick={() => setPreviewProof(order.proof_url || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Bukti TF
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-3 text-xs text-neutral-700 space-y-1.5">
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span>• <strong>{it.name}</strong> (Size {it.size}{it.color ? `, ${it.color}` : ''}) × {it.quantity}</span>
                      <span className="font-semibold text-neutral-900 shrink-0">{formatRupiah(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Status Pesanan</label>
                    <select
                      value={d.status}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, status: e.target.value } }))}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 bg-white focus:outline-none focus:border-black"
                    >
                      <option value="pending">Menunggu Konfirmasi</option>
                      <option value="packed">Sedang Dikemas</option>
                      <option value="shipped">Dalam Pengiriman</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Jadwal / Estimasi Kirim</label>
                    <input
                      type="text"
                      value={d.shipping_estimate}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, shipping_estimate: e.target.value } }))}
                      placeholder="Misal: Dikirim hari ini jam 20.00 WIB"
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Kurir / Ekspedisi</label>
                    <input
                      type="text"
                      value={d.courier}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, courier: e.target.value } }))}
                      placeholder="J&T Express / JNE / SiCepat / SPX"
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Nomor Resi</label>
                    <input
                      type="text"
                      value={d.tracking_number}
                      onChange={(e) => setDrafts((p) => ({ ...p, [order.id]: { ...d, tracking_number: e.target.value } }))}
                      placeholder="Masukkan nomor resi pengiriman..."
                      className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => openWhatsAppNotify(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Kabarin via WA
                  </button>
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => handleSave(order.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition"
                  >
                    {savedId === order.id ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Tersimpan</> : <><Save className="w-3.5 h-3.5" /> Simpan Update</>}
                  </button>
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
