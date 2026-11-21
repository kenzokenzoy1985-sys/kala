import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ShoppingBag,
  Search,
  X,
  Plus,
  Minus,
  ArrowRight,
  Phone,
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  Trash2,
  Upload,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react';

// ============================================================================
// PENGATURAN TOKO & SUPABASE (EDIT 4 BARIS INI)
// ============================================================================
const STORE_NAME_FIRST = 'WS';
const STORE_NAME_SECOND = 'STORE';
const WHATSAPP_NUMBER = '6281234567890'; // Ganti nomor WA lo (diawali 62)
const ADMIN_PASSWORD = 'ADMINWS312'; // Ganti password rahasia halaman admin lo

const SUPABASE_URL = 'https://pymfcglqwejqfixmhnlf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QqUkadWoEnWcCZMhLxfhjA_NcFS8yr-';
// ============================================================================

const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

interface Product {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  tag?: string;
  image: string;
  description: string;
}

interface CartItem extends Product {
  size: string;
  quantity: number;
}

const CATEGORY_OPTIONS = [
  { key: 'tops', label: 'Kaos & Atasan' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'pants', label: 'Celana' },
  { key: 'accessories', label: 'Aksesori' },
];

const FILTER_CATEGORIES = [
  { key: 'all', label: 'Semua Produk' },
  ...CATEGORY_OPTIONS,
];

const SIZES = ['S', 'M', 'L', 'XL'];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Heavyweight Boxy Tee',
    category: 'tops',
    categoryLabel: 'Kaos & Atasan',
    price: 189000,
    originalPrice: 229000,
    tag: 'BESTSELLER',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
    description:
      'Cotton Combed 16s Heavyweight 235 GSM. Potongan boxy modern, kerah rib tebal anti melar.',
  },
];

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(
    () =>
      window.location.hash === '#admin' ||
      window.location.pathname === '/admin'
  );

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    {}
  );
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('tops');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(
        window.location.hash === '#admin' ||
          window.location.pathname === '/admin'
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const fetchProducts = async () => {
    if (!supabase) {
      setIsLoadingProducts(false);
      return;
    }
    setIsLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      if (data.length > 0) {
        const mapped: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          categoryLabel: item.category_label,
          price: Number(item.price),
          originalPrice: item.original_price
            ? Number(item.original_price)
            : undefined,
          tag: item.tag || undefined,
          image: item.image,
          description: item.description,
        }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    }
    setIsLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('Publishable Key Supabase belum diisi di dalam file App.tsx!');
      return;
    }
    if (!imageFile) {
      alert('Pilih foto produk terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const categoryObj =
        CATEGORY_OPTIONS.find((c) => c.key === newCategory) ||
        CATEGORY_OPTIONS[0];

      const { error: insertError } = await supabase.from('products').insert([
        {
          name: newName,
          category: newCategory,
          category_label: categoryObj.label,
          price: Number(newPrice),
          original_price: newOriginalPrice ? Number(newOriginalPrice) : null,
          tag: newTag.trim() || null,
          image: urlData.publicUrl,
          description: newDescription,
        },
      ]);

      if (insertError) throw insertError;

      setNewName('');
      setNewPrice('');
      setNewOriginalPrice('');
      setNewTag('');
      setNewDescription('');
      setImageFile(null);
      setImagePreview('');
      await fetchProducts();
      alert('Produk berhasil ditambahkan ke toko!');
    } catch (err: any) {
      alert('Gagal upload produk: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!supabase) return;
    const confirmDelete = window.confirm(`Yakin mau hapus "${name}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      await fetchProducts();
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    const size = selectedSizes[product.id] || 'M';
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, size, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.size === size
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;
    const itemLines = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (Size ${item.size}) x${
            item.quantity
          } - ${formatRupiah(item.price * item.quantity)}`
      )
      .join('%0A');

    const message =
      `Halo Admin ${STORE_NAME_FIRST} ${STORE_NAME_SECOND}! Saya mau pesan:%0A%0A` +
      `${itemLines}%0A%0A` +
      `Subtotal: ${formatRupiah(subtotal)}%0A` +
      (promoApplied ? `Diskon Promo (10%): -${formatRupiah(discount)}%0A` : '') +
      `*Total Bayar: ${formatRupiah(total)}*%0A%0A` +
      `Nama: ${customerName || '-'}%0A` +
      `Alamat Pengiriman: ${customerAddress || '-'}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  if (isAdminRoute) {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Dashboard</h1>
                <p className="text-xs text-neutral-400">
                  {STORE_NAME_FIRST}.{STORE_NAME_SECOND}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput === ADMIN_PASSWORD) {
                  setIsAdminLoggedIn(true);
                  setLoginError('');
                } else {
                  setLoginError('Password salah!');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">
                  Password Admin
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-white"
                />
                {loginError && (
                  <p className="text-xs text-red-400 mt-1.5">{loginError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-neutral-200 transition"
              >
                Masuk Dashboard
              </button>
            </form>

            <button
              onClick={() => {
                window.location.hash = '';
                setIsAdminRoute(false);
              }}
              className="w-full text-center text-xs text-neutral-500 hover:text-white"
            >
              ← Kembali ke Halaman Toko
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-lg">
                {STORE_NAME_FIRST}
                <span className="text-neutral-400">.</span>
                {STORE_NAME_SECOND}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.location.hash = '';
                  setIsAdminRoute(false);
                }}
                className="text-xs font-medium px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-100"
              >
                Lihat Toko
              </button>
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="p-2 text-neutral-500 hover:text-red-600"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
          {!isSupabaseConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
              <strong>Perhatian:</strong> Kamu belum memasukkan{' '}
              <code>SUPABASE_ANON_KEY</code> di bagian atas file{' '}
              <code>src/App.tsx</code>.
            </div>
          )}

          <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Produk Baru
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Foto Produk (Pilih dari Galeri) *
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl p-4 cursor-pointer hover:border-black transition bg-neutral-50">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center py-4">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-neutral-700">
                        Klik untuk pilih foto baju
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        JPG, PNG, atau WEBP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Boxy Oversized Tee"
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm bg-white focus:outline-none focus:border-black"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Harga Jual (Angka saja) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Contoh: 189000"
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Harga Coret / Sebelum Diskon (Opsional)
                  </label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="Contoh: 229000"
                    className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Label / Tag (Opsional)
                </label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Contoh: BESTSELLER atau NEW ARRIVAL"
                  className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Deskripsi Bahan & Ukuran *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Contoh: Cotton Combed 16s 235 GSM, cutting boxy..."
                  className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting
                  ? 'Sedang Mengupload Foto...'
                  : 'Upload & Tampilkan di Toko'}
              </button>
            </form>
          </section>

          <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4">
              Daftar Produk Aktif ({products.length})
            </h2>

            {products.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                Belum ada produk di database. Silakan tambah produk di atas.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {item.categoryLabel} • {formatRupiah(item.price)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(item.id, item.name)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <div className="bg-neutral-950 text-white text-[11px] tracking-widest uppercase py-2.5 px-4 text-center font-medium">
        GUNAKAN KODE <span className="underline font-bold">KALABARU</span> UNTUK
        DISKON 10% PESANAN PERTAMA
      </div>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="text-xl font-black tracking-tighter">
            {STORE_NAME_FIRST}
            <span className="text-neutral-400">.</span>
            {STORE_NAME_SECOND}
          </a>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-neutral-100 transition"
            aria-label="Keranjang Belanja"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-14 border-b border-neutral-100">
        <span className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 bg-neutral-100 rounded-full text-neutral-600 mb-4">
          KOLEKSI TERBARU
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-2xl">
          ESSENTIAL WEAR UNTUK GAYA SETIAP HARI.
        </h1>
        <p className="mt-4 text-neutral-500 text-sm sm:text-base max-w-xl leading-relaxed">
          Material pilihan, cutting boxy santai, dan jahitan presisi standar
          distro premium. Siap order cepat langsung via WhatsApp tanpa perlu
          login akun.
        </p>
        <div className="mt-7">
          <a
            href="#katalog"
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3.5 rounded-full hover:bg-neutral-800 transition"
          >
            Jelajahi Produk <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <main id="katalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.key
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="text-center py-20 text-sm text-neutral-400">
            Memuat koleksi produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-sm text-neutral-400">
            Produk tidak ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const activeSize = selectedSizes[product.id] || 'M';
              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between bg-white"
                >
                  <div>
                    <div className="relative aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {product.tag && (
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                          {product.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {product.categoryLabel}
                    </p>
                    <h3 className="text-lg font-bold mt-0.5">{product.name}</h3>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] text-neutral-400 font-medium">
                        Pilih Ukuran:
                      </span>
                      <div className="flex gap-1.5">
                        {SIZES.map((sz) => (
                          <button
                            key={sz}
                            onClick={() =>
                              setSelectedSizes((prev) => ({
                                ...prev,
                                [product.id]: sz,
                              }))
                            }
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                              activeSize === sz
                                ? 'bg-black text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-base">
                          {formatRupiah(product.price)}
                        </p>
                        {product.originalPrice && (
                          <p className="text-xs text-neutral-400 line-through">
                            {formatRupiah(product.originalPrice)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2.5 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <section className="border-t border-neutral-100 bg-neutral-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-neutral-800" />
            <h4 className="font-bold text-sm">Kualitas Terjamin</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Quality control ketat sebelum paket dikirim.
            </p>
          </div>
          <div className="p-4">
            <Truck className="w-6 h-6 mx-auto mb-2 text-neutral-800" />
            <h4 className="font-bold text-sm">Pengiriman Cepat</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Order sebelum jam 15.00 dikirim di hari yang sama.
            </p>
          </div>
          <div className="p-4">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 text-neutral-800" />
            <h4 className="font-bold text-sm">Tukar Ukuran Mudah</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Garansi tukar size maksimal 3 hari setelah barang tiba.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 px-4 text-center text-xs text-neutral-400">
        <p>
          © 2026 {STORE_NAME_FIRST}.{STORE_NAME_SECOND}. All rights reserved.
        </p>
      </footer>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h2 className="font-bold text-lg">
                  Keranjang ({totalItems})
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 text-sm text-neutral-400">
                  Keranjang belanja masih kosong.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 my-4">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.size}`}
                      className="py-4 flex gap-3.5"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover rounded-xl bg-neutral-100"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-xs text-neutral-400">
                          Ukuran: {item.size}
                        </p>
                        <p className="font-bold text-xs mt-1">
                          {formatRupiah(item.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, -1)
                            }
                            className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.size, 1)
                            }
                            className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-neutral-100 pt-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Kode promo (KALABARU)"
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => {
                      if (promoInput.trim().toUpperCase() === 'KALABARU') {
                        setPromoApplied(true);
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl"
                  >
                    Pakai
                  </button>
                </div>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama penerima..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs"
                />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Alamat lengkap pengiriman..."
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs"
                />

                <div className="pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Diskon (10%)</span>
                      <span>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base pt-1">
                    <span>Total</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-4 h-4" /> Pesan via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}