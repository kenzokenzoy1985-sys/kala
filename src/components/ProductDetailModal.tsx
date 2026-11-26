import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';

export type SizeKey = 'S' | 'M' | 'L' | 'XL';
export const SIZES: SizeKey[] = ['S', 'M', 'L', 'XL'];
export type StockMap = Record<SizeKey, number>;

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  tag?: string;
  image: string;
  images?: string[];
  description: string;
  stock: StockMap;
  colors?: string[];
}

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: SizeKey, color?: string) => void;
  onBuyNow?: (product: Product, size: SizeKey, color?: string) => void;
  formatRupiah: (amount: number) => string;
}

const COLOR_HEX: Record<string, string> = {
  hitam: '#18181b', black: '#18181b', putih: '#f4f4f5', white: '#f4f4f5',
  navy: '#1e3a5f', biru: '#2563eb', blue: '#2563eb', abu: '#71717a',
  grey: '#71717a', gray: '#71717a', cream: '#e7dcc8', krem: '#e7dcc8',
  beige: '#d6c6a8', olive: '#556b2f', hijau: '#16a34a', green: '#16a34a',
  maroon: '#7f1d1d', merah: '#dc2626', red: '#dc2626', coklat: '#78350f',
  brown: '#78350f', khaki: '#c3b091', pink: '#ec4899', kuning: '#eab308',
};

export function getColorHex(name: string): string | null {
  const k = name.trim().toLowerCase();
  for (const key of Object.keys(COLOR_HEX)) {
    if (k.includes(key)) return COLOR_HEX[key];
  }
  return null;
}

export function ProductDetailModal({ product, onClose, onAddToCart, onBuyNow, formatRupiah }: ProductDetailModalProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<SizeKey>('M');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActiveImgIdx(0);
    setShowSizeChart(false);
    setSelectedSize(SIZES.find((s) => (product.stock?.[s] ?? 0) > 0) || 'M');
    setSelectedColor(product.colors?.[0] || '');
  }, [product]);

  if (!product) return null;

  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const origPrice = product.originalPrice ?? (product as any).original_price;
  const activeStock = product.stock?.[selectedSize] ?? 0;
  const isTotalOut = SIZES.every((s) => (product.stock?.[s] ?? 0) <= 0);
  const colors = product.colors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-5" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-zinc-200 text-zinc-950 shadow-2xl grid grid-cols-1 md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Tutup" className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/90 border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-400 flex items-center justify-center transition cursor-pointer shadow-xs">
          <X className="w-4 h-4" />
        </button>

        <div className="bg-zinc-50 p-4 sm:p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200">
            {images.length > 0 ? (
              <img src={images[activeImgIdx] || images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">Tidak ada foto</div>
            )}
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => setActiveImgIdx((p) => (p === 0 ? images.length - 1 : p - 1))} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-zinc-200 text-zinc-900 flex items-center justify-center hover:bg-white shadow-xs cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                <button type="button" onClick={() => setActiveImgIdx((p) => (p === images.length - 1 ? 0 : p + 1))} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-zinc-200 text-zinc-900 flex items-center justify-center hover:bg-white shadow-xs cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImgIdx(idx)} className={`w-14 h-16 shrink-0 rounded-lg overflow-hidden border transition cursor-pointer ${activeImgIdx === idx ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200 opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full">{product.category}</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-950 mt-2 leading-snug">{product.name}</h2>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="font-display text-xl font-bold text-zinc-950">{formatRupiah(product.price)}</span>
                {origPrice && origPrice > product.price && <span className="text-sm text-zinc-600 font-medium line-through">{formatRupiah(origPrice)}</span>}
              </div>
            </div>
            {product.description && <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">{product.description}</p>}

            {colors.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-medium text-zinc-600">
                  Pilih Warna: <strong className="text-zinc-950">{selectedColor || colors[0]}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c, idx) => {
                    const hex = getColorHex(c);
                    const active = (selectedColor || colors[0]) === c;
                    return (
                      <button key={c} type="button" onClick={() => { setSelectedColor(c); if (idx < images.length) setActiveImgIdx(idx); }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${active ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-400'}`}>
                        {hex && <span className="w-3 h-3 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: hex }} />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600">
                  Pilih Ukuran: <strong className="text-zinc-950">{selectedSize}</strong>
                  {activeStock > 0 && <span className="text-zinc-400 ml-1.5">(Stok: {activeStock})</span>}
                </span>
                <button type="button" onClick={() => setShowSizeChart((v) => !v)} className="text-[11px] font-semibold text-zinc-900 underline hover:text-zinc-600 cursor-pointer">
                  {showSizeChart ? 'Tutup Size Chart' : 'Lihat Size Chart'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((sz) => {
                  const disabled = (product.stock?.[sz] ?? 0) <= 0;
                  const active = selectedSize === sz && !disabled;
                  return (
                    <button key={sz} type="button" disabled={disabled} onClick={() => setSelectedSize(sz)} className={`py-2.5 rounded-xl text-xs font-semibold border transition ${disabled ? 'border-zinc-100 bg-zinc-50 text-zinc-300 line-through cursor-not-allowed' : active ? 'border-zinc-950 bg-zinc-950 text-white cursor-pointer' : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400 cursor-pointer'}`}>
                      {sz}
                    </button>
                  );
                })}
              </div>
              {showSizeChart && (
                <div className="mt-2 rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-[11px]">
                  <p className="font-semibold text-zinc-900 mb-1.5">Panduan Ukuran (cm)</p>
                  <div className="grid grid-cols-3 text-zinc-500 border-b border-zinc-200 pb-1 mb-1 font-medium">
                    <span>Size</span><span>Lebar Dada</span><span>Panjang</span>
                  </div>
                  {[['S','52 cm','68 cm'],['M','54 cm','70 cm'],['L','56 cm','72 cm'],['XL','58 cm','74 cm']].map(([s,w,l]) => (
                    <div key={s} className="grid grid-cols-3 text-zinc-700 py-0.5">
                      <span className="font-semibold text-zinc-950">{s}</span><span>{w}</span><span>{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2.5">
            <button type="button" disabled={isTotalOut || activeStock <= 0} onClick={() => { onAddToCart(product, selectedSize, selectedColor || colors[0] || ''); onClose(); }} className="py-3 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-300 disabled:bg-zinc-50 disabled:text-zinc-300 text-zinc-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed">
              <ShoppingBag className="w-4 h-4" />
              {isTotalOut ? 'Habis' : '+ Keranjang'}
            </button>
            <button type="button" disabled={isTotalOut || activeStock <= 0} onClick={() => { (onBuyNow || onAddToCart)(product, selectedSize, selectedColor || colors[0] || ''); onClose(); }} className="py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed">
              {isTotalOut ? 'Stok Habis' : 'Beli Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
