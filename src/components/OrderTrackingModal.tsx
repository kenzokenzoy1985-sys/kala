import { useState, useEffect } from 'react';
import { X, Package, Truck, CheckCircle2, Clock, Search, Copy, Check, RefreshCw, MapPin, AlertCircle } from 'lucide-react';

interface OrderItem {
  id?: string;
  name: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
}

interface OrderRecord {
  id: string;
  order_code?: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  total: number;
  promo_code?: string;
  status: string;
  courier?: string;
  tracking_number?: string;
  shipping_estimate?: string;
}

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabase: any;
  formatRupiah: (amount: number) => string;
  savedOrderCodes: string[];
}

const STEPS = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'packed', label: 'Dikemas' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
];

const STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: 'Menunggu Konfirmasi', color: 'text-amber-700 bg-amber-50 border-amber-200', step: 0 },
  packed: { label: 'Sedang Dikemas', color: 'text-sky-700 bg-sky-50 border-sky-200', step: 1 },
  shipped: { label: 'Dalam Pengiriman', color: 'text-zinc-950 bg-[#D6C0A0]/15 border-[#D6C0A0]/40', step: 2 },
  completed: { label: 'Pesanan Selesai', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', step: 3 },
  cancelled: { label: 'Dibatalkan', color: 'text-red-400 bg-red-400/10 border-red-400/30', step: -1 },
};

export function OrderTrackingModal({ isOpen, onClose, supabase, formatRupiah, savedOrderCodes }: OrderTrackingModalProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const loadSavedOrders = async () => {
    if (!supabase || savedOrderCodes.length === 0) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('order_code', savedOrderCodes)
        .order('created_at', { ascending: false });
      setOrders((data as OrderRecord[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearched(false);
      setQuery('');
      loadSavedOrders();
    }
  }, [isOpen, savedOrderCodes.join(',')]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setSearched(false);
      loadSavedOrders();
      return;
    }
    if (!supabase) return;
    setLoading(true);
    setSearched(true);
    try {
      const safe = q.replace(/[,%]/g, '');
      const { data } = await supabase
        .from('orders')
        .select('*')
        .or(`order_code.ilike.%${safe}%,customer_phone.ilike.%${safe}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      setOrders((data as OrderRecord[]) || []);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-zinc-200 text-zinc-950 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-zinc-950" />
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-950">Pesanan Saya</h2>
              <p className="text-[11px] text-zinc-500">Cek status, jadwal kirim, dan resi pesanan kamu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => (query.trim() ? handleSearch({ preventDefault: () => {} } as any) : loadSavedOrders())} title="Refresh Status" className="w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 flex items-center justify-center transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="px-5 py-3 bg-white border-b border-zinc-200 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lacak pakai Kode Order (WS-...) atau No. HP..."
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-950 placeholder-zinc-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-950 text-xs font-bold transition">
            Lacak
          </button>
        </form>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">Memuat data pesanan...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-800">
                {searched ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan di perangkat ini'}
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {searched
                  ? 'Pastikan Kode Order (contoh: WS-123456) atau No. HP yang dimasukkan sudah sesuai.'
                  : 'Setelah checkout QRIS, pesananmu otomatis muncul di sini. Kamu juga bisa melacak pakai Kode Order atau No. HP di kolom atas.'}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              const code = order.order_code || ('#' + order.id.slice(0, 6).toUpperCase());
              const dateStr = new Date(order.created_at).toLocaleString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={order.id} className="rounded-xl bg-white border border-zinc-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-sm font-bold text-zinc-950">{code}</span>
                      <span className="text-[11px] text-zinc-500 ml-2">{dateStr}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Progress Bar ala Shopee */}
                    {order.status === 'cancelled' ? (
                      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/25 p-3 text-xs text-red-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Pesanan ini dibatalkan oleh admin. Hubungi kami jika butuh bantuan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1 relative">
                        {STEPS.map((st, idx) => {
                          const done = meta.step >= idx;
                          return (
                            <div key={st.key} className="flex flex-col items-center text-center gap-1.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border transition ${done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                                {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] sm:text-[11px] font-medium ${done ? 'text-zinc-950' : 'text-zinc-500'}`}>
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Info Jadwal Kirim & Resi */}
                    <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Truck className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5" />
                        <div className="text-xs">
                          <p className="text-zinc-500 text-[11px]">Jadwal &amp; Info Pengiriman</p>
                          <p className="text-zinc-950 font-medium mt-0.5">
                            {order.shipping_estimate || 'Estimasi dikirim dalam 1x24 jam setelah pembayaran dikonfirmasi'}
                          </p>
                        </div>
                      </div>
                      {(order.courier || order.tracking_number) && (
                        <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-zinc-500">Kurir: </span>
                            <span className="text-zinc-900 font-semibold">{order.courier || '-'}</span>
                            {order.tracking_number && (
                              <>
                                <span className="text-zinc-600 mx-1.5">•</span>
                                <span className="text-zinc-500">Resi: </span>
                                <span className="text-zinc-950 font-mono font-semibold">{order.tracking_number}</span>
                              </>
                            )}
                          </div>
                          {order.tracking_number && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(order.tracking_number || '');
                                setCopiedId(order.id);
                                setTimeout(() => setCopiedId(null), 1800);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:border-zinc-400 text-[11px] text-zinc-800 transition"
                            >
                              {copiedId === order.id ? <><Check className="w-3 h-3 text-emerald-400" /> Tersalin</> : <><Copy className="w-3 h-3" /> Salin Resi</>}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Daftar Barang */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-zinc-500">Barang yang dibeli:</p>
                      <div className="divide-y divide-[#232329] rounded-lg bg-zinc-50 border border-zinc-200 px-3">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="py-2 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="text-zinc-950 font-medium truncate">{item.name}</p>
                              <p className="text-[11px] text-zinc-500">
                                Size {item.size}{item.color ? ` • ${item.color}` : ''} × {item.quantity}
                              </p>
                            </div>
                            <span className="font-semibold text-zinc-900 shrink-0">{formatRupiah(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-500 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">{order.customer_name} — {order.customer_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Total:</span>
                        <span className="font-display text-sm font-bold text-zinc-950">{formatRupiah(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
