import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Product } from './ProductDetailModal';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  supabase: any;
  onUpdated: (updated: Product) => void;
}

export function EditProductModal({ product, onClose, supabase, onUpdated }: EditProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [tag, setTag] = useState('');
  const [colors, setColors] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setName(product.name || '');
    setPrice(String(product.price || ''));
    const orig = product.originalPrice ?? (product as any).original_price;
    setOriginalPrice(orig ? String(orig) : '');
    setTag(product.tag || '');
    setColors((product.colors || []).join(', '));
    setDescription(product.description || '');
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      alert('Nama dan harga produk wajib diisi.');
      return;
    }
    if (!supabase) return;
    setSaving(true);
    try {
      const parsedColors = colors.split(',').map((c) => c.trim()).filter(Boolean);
      const numPrice = Number(price);
      const numOrig = originalPrice ? Number(originalPrice) : null;
      const { error } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          price: numPrice,
          original_price: numOrig,
          tag: tag.trim() || null,
          colors: parsedColors,
          description: description.trim(),
        })
        .eq('id', product.id);
      if (error) throw error;
      onUpdated({
        ...product,
        name: name.trim(),
        price: numPrice,
        originalPrice: numOrig || undefined,
        tag: tag.trim() || undefined,
        colors: parsedColors,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan perubahan produk.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 text-neutral-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
          <h3 className="text-base font-bold">Edit Produk</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Nama Produk *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Harga Jual *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Harga Coret (Opsional)</label>
              <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Kosongkan jika tidak diskon" className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Pilihan Warna (pisah koma)</label>
              <input type="text" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Hitam, Putih, Navy" className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Label / Tag (Opsional)</label>
              <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Best Seller / New" className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Deskripsi</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
