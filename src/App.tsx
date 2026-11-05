import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  Plus,
  Minus,
  ArrowRight,
  Check,
  Phone,
  ShieldCheck,
  Truck,
  RefreshCw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice: number | null;
  tag: string | null;
  sizes: string[];
  image: string;
  description: string;
}

interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  image: string;
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: 'k-01',
    name: 'KALA Heavyweight',
    category: 'tops',
    categoryLabel: 'Kaos & Atasan',
    price: 189000,
    originalPrice: 229000,
    tag: 'BESTSELLER',
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    description:
      'Cotton Combed 16s Heavyweight 235 GSM. Potongan boxy modern, kerah rib tebal anti melar.',
  },
  {
    id: 'k-02',
    name: 'Raw Edge Oversized Hoodie',
    category: 'outerwear',
    categoryLabel: 'Outerwear',
    price: 389000,
    originalPrice: 449000,
    tag: 'NEW DROP',
    sizes: ['M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    description:
      'Cotton Fleece 330 GSM tebal bertekstur. Detail unfinished hem di bagian manset dan saku kangaroo.',
  },
  {
    id: 'k-03',
    name: 'Pleated Parachute Relaxed Pants',
    category: 'pants',
    categoryLabel: 'Celana',
    price: 279000,
    originalPrice: 319000,
    tag: 'TRENDING',
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80',
    description:
      'Bahan taslan semi-matte water-repellent. Tali serut adjustable di pinggang dan pergelangan kaki.',
  },
  {
    id: 'k-04',
    name: 'Vintage Wash Daily Shirt',
    category: 'tops',
    categoryLabel: 'Kaos & Atasan',
    price: 249000,
    originalPrice: 289000,
    tag: null,
    sizes: ['M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
    description:
      'Katun linen washed adem berserat alami. Potongan relax fit santai untuk aktivitas seharian.',
  },
  {
    id: 'k-05',
    name: 'Techwear Utility Crossbody Bag',
    category: 'accessories',
    categoryLabel: 'Aksesoris',
    price: 169000,
    originalPrice: 199000,
    tag: 'LIMITED',
    sizes: ['All Size'],
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    description:
      'Cordura 600D tahan cipratan air. Kompartemen ganda dengan strap YKK quick-release buckle.',
  },
  {
    id: 'k-06',
    name: 'Carpenter Straight Cargo Denim',
    category: 'pants',
    categoryLabel: 'Celana',
    price: 369000,
    originalPrice: 429000,
    tag: null,
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop&q=80',
    description:
      'Denim non-stretch 13.5 oz warna faded indigo. Dilengkapi aksen hammer loop dan saku perkakas khas workwear.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Semua Produk' },
  { key: 'tops', label: 'Kaos & Atasan' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'pants', label: 'Celana' },
  { key: 'accessories', label: 'Aksesoris' },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    'k-01': 'M',
    'k-02': 'L',
    'k-03': 'M',
    'k-04': 'L',
    'k-05': 'All Size',
    'k-06': 'M',
  });
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoError, setPromoError] = useState<string>('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>(
    'cart'
  );
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'qris',
    notes: '',
  });

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product: Product) => {
    const chosenSize = selectedSizes[product.id] || product.sizes[0];
    const cartItemId = `${product.id}-${chosenSize}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          size: chosenSize,
          image: product.image,
          quantity: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'KALABARU') {
      setDiscountPercent(10);
      setPromoError('');
    } else {
      setPromoError('Kode voucher tidak valid');
      setDiscountPercent(0);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter((p) => {
      const matchCat =
        selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  }, [selectedCategory, searchQuery, sortBy]);

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = Math.round(cartSubtotal * (discountPercent / 100));
  const cartTotal = cartSubtotal - discountAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendToWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      alert('Mohon isi nama, nomor HP, dan alamat pengiriman.');
      return;
    }

    const itemsText = cart
      .map(
        (item) =>
          `- ${item.name} (${item.size}) x${item.quantity} = Rp ${(
            item.price * item.quantity
          ).toLocaleString('id-ID')}`
      )
      .join('%0A');

    const message =
      `Halo Admin KALA STUDIOS! Saya mau pesan:%0A%0A` +
      `*Nama:* ${orderForm.name}%0A` +
      `*No HP:* ${orderForm.phone}%0A` +
      `*Alamat:* ${orderForm.address}%0A` +
      `*Metode Bayar:* ${orderForm.paymentMethod.toUpperCase()}%0A` +
      (orderForm.notes ? `*Catatan:* ${orderForm.notes}%0A` : '') +
      `%0A*Rincian Belanja:*%0A${itemsText}%0A%0A` +
      `*Subtotal:* Rp ${cartSubtotal.toLocaleString('id-ID')}%0A` +
      (discountAmount > 0
        ? `*Diskon Promo:* -Rp ${discountAmount.toLocaleString('id-ID')}%0A`
        : '') +
      `*Total Bayar:* Rp ${cartTotal.toLocaleString('id-ID')}`;

    // Ganti nomor di bawah ini dengan nomor WhatsApp tokomu
    const waUrl = `https://wa.me/6282321942197?text=${message}`;
    window.open(waUrl, '_blank');
    setCheckoutStep('success');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1E1E1E] antialiased selection:bg-neutral-900 selection:text-white font-sans">
      <div className="bg-black text-white text-[12px] py-2 px-4 text-center tracking-widest uppercase font-medium flex items-center justify-center gap-2">
        <Sparkles size={13} className="text-amber-400" />
        <span>
          Gunakan kode <b>KALABARU</b> untuk diskon 10% pesanan pertama
        </span>
      </div>

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-xl font-black tracking-tighter uppercase font-mono"
            >
              KALA<span className="text-neutral-400">.</span>STUDIOS
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
              <a href="#katalog" className="hover:text-black transition">
                Katalog
              </a>
              <a href="#size-chart" className="hover:text-black transition">
                Size Chart
              </a>
              <a href="#guarantee" className="hover:text-black transition">
                Keunggulan
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Cari artikel baju..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-100/80 border-0 rounded-full pl-9 pr-4 py-1.5 text-xs w-48 focus:w-64 focus:bg-white focus:ring-1 focus:ring-black transition-all outline-none"
              />
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-neutral-400"
              />
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full hover:bg-neutral-100 transition flex items-center justify-center text-neutral-800"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-neutral-50 border-b border-neutral-200/60 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 bg-white border border-neutral-200 rounded-full text-xs font-semibold tracking-wider uppercase text-neutral-600">
              Koleksi Terbaru
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-neutral-900">
              ESSENTIAL WEAR UNTUK GAYA SETIAP HARI.
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base max-w-lg leading-relaxed">
              Material pilihan, cutting boxy santai, dan jahitan presisi standar
              distro premium. Siap order cepat langsung via WhatsApp tanpa perlu
              login akun.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href="#katalog"
                className="px-6 py-3.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-neutral-800 transition flex items-center gap-2 group shadow-sm"
              >
                Jelajahi Produk
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </a>
              <a
                href="#size-chart"
                className="px-6 py-3.5 bg-white border border-neutral-300 text-neutral-800 rounded-full text-sm font-semibold hover:bg-neutral-100 transition"
              >
                Cek Panduan Ukuran
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-200 shadow-xl border border-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000&auto=format&fit=crop&q=80"
                alt="Fashion Apparel Showcase"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.key
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative inline-block text-left">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-neutral-100 text-xs font-semibold px-4 py-2.5 pr-8 rounded-full border-none cursor-pointer outline-none focus:ring-1 focus:ring-black"
              >
                <option value="featured">Paling Populer</option>
                <option value="price-low">Harga: Rendah ke Tinggi</option>
                <option value="price-high">Harga: Tinggi ke Rendah</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-3 pointer-events-none text-neutral-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
          {filteredProducts.map((product) => {
            const currentSize = selectedSizes[product.id] || product.sizes[0];
            return (
              <div
                key={product.id}
                className="group flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-square bg-neutral-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {product.tag && (
                    <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                      {product.tag}
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                      {product.categoryLabel}
                    </span>
                    <h3 className="font-bold text-base text-neutral-900 group-hover:text-neutral-700 transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 space-y-3">
                    <div>
                      <span className="text-[11px] font-medium text-neutral-400 block mb-1.5">
                        Pilih Ukuran:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {product.sizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => handleSelectSize(product.id, sz)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
                              currentSize === sz
                                ? 'bg-black text-white border-black'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-lg font-black text-neutral-900">
                          Rp {product.price.toLocaleString('id-ID')}
                        </div>
                        {product.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            Rp {product.originalPrice.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-black hover:bg-neutral-800 text-white px-4 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Plus size={14} />
                        Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-neutral-500 text-sm">
              Produk yang kamu cari tidak ditemukan.
            </p>
          </div>
        )}
      </section>

      <section
        id="size-chart"
        className="bg-neutral-100 py-16 border-y border-neutral-200"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-neutral-900">
              PANDUAN UKURAN (SIZE CHART)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Cek estimasi ukuran baju yang paling pas untuk badanmu
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-neutral-900 text-white font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Lebar Dada (cm)</th>
                    <th className="py-3 px-4">Panjang Badan (cm)</th>
                    <th className="py-3 px-4">Estimasi BB (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-black">S</td>
                    <td className="py-3 px-4">52</td>
                    <td className="py-3 px-4">68</td>
                    <td className="py-3 px-4">45 - 58 kg</td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-black">M</td>
                    <td className="py-3 px-4">55</td>
                    <td className="py-3 px-4">71</td>
                    <td className="py-3 px-4">59 - 70 kg</td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-black">L</td>
                    <td className="py-3 px-4">58</td>
                    <td className="py-3 px-4">74</td>
                    <td className="py-3 px-4">71 - 82 kg</td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-black">XL</td>
                    <td className="py-3 px-4">62</td>
                    <td className="py-3 px-4">77</td>
                    <td className="py-3 px-4">83 - 95 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-[11px] text-neutral-500 text-center">
              *Toleransi ukuran ± 1 - 2 cm karena proses produksi.
            </div>
          </div>
        </div>
      </section>

      <section id="guarantee" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200">
            <Truck className="mx-auto mb-3 text-neutral-800" size={24} />
            <h4 className="font-bold text-sm mb-1">Pengiriman Cepat</h4>
            <p className="text-xs text-neutral-500">
              Order sebelum jam 16:00 WIB dikirim di hari yang sama.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-neutral-200">
            <ShieldCheck className="mx-auto mb-3 text-neutral-800" size={24} />
            <h4 className="font-bold text-sm mb-1">Garansi Produk Asli</h4>
            <p className="text-xs text-neutral-500">
              Jaminan material katun kualitas premium & jahitan rapi.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-neutral-200">
            <RefreshCw className="mx-auto mb-3 text-neutral-800" size={24} />
            <h4 className="font-bold text-sm mb-1">Bisa Tukar Ukuran</h4>
            <p className="text-xs text-neutral-500">
              Kekecilan atau kebesaran? Bisa retur maksimal 3 hari.
            </p>
          </div>
        </div>
      </section>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <h3 className="font-bold text-base">
                    {checkoutStep === 'cart'
                      ? 'Keranjang Belanja'
                      : 'Form Pemesanan'}
                  </h3>
                  <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded-full font-bold">
                    {totalItems}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-neutral-200 text-neutral-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {checkoutStep === 'cart' && (
                  <>
                    {cart.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-center">
                        <ShoppingBag
                          size={40}
                          className="text-neutral-300 mb-3"
                        />
                        <p className="text-sm text-neutral-500">
                          Keranjang masih kosong nih.
                        </p>
                        <button
                          onClick={() => setIsCartOpen(false)}
                          className="mt-4 text-xs font-bold underline"
                        >
                          Mulai Belanja
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.cartItemId}
                            className="flex gap-3.5 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover bg-neutral-200"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold line-clamp-1">
                                  {item.name}
                                </h4>
                                <span className="text-[11px] text-neutral-500 block">
                                  Size: {item.size}
                                </span>
                                <span className="text-xs font-semibold text-neutral-900 mt-0.5 block">
                                  Rp {item.price.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() =>
                                    updateCartQty(item.cartItemId, -1)
                                  }
                                  className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 text-neutral-700"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartQty(item.cartItemId, 1)
                                  }
                                  className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 text-neutral-700"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === 'form' && (
                  <form
                    id="checkout-form"
                    onSubmit={handleSendToWhatsApp}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold block mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kenzo"
                        value={orderForm.name}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, name: e.target.value })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">
                        Nomor WhatsApp Aktif
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890"
                        value={orderForm.phone}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, phone: e.target.value })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:ring-1 focus:ring-black outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">
                        Alamat Pengiriman
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan, kota, kode pos"
                        value={orderForm.address}
                        onChange={(e) =>
                          setOrderForm({
                            ...orderForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-neutral-300 focus:ring-1 focus:ring-black outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">
                        Metode Pembayaran
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['qris', 'transfer', 'cod'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() =>
                              setOrderForm({
                                ...orderForm,
                                paymentMethod: method,
                              })
                            }
                            className={`p-2 rounded-lg text-xs font-bold uppercase border transition ${
                              orderForm.paymentMethod === method
                                ? 'bg-black text-white border-black'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                      <Check size={24} />
                    </div>
                    <h4 className="font-bold text-lg">Pesanan Diteruskan!</h4>
                    <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                      Format order sudah dibuka di WhatsApp admin. Silakan kirim
                      pesan untuk konfirmasi pembayaran & resi.
                    </p>
                    <button
                      onClick={() => {
                        setCart([]);
                        setCheckoutStep('cart');
                        setIsCartOpen(false);
                      }}
                      className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-bold"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && checkoutStep !== 'success' && (
                <div className="p-5 border-t border-neutral-100 bg-neutral-50 space-y-3">
                  {checkoutStep === 'cart' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Punya voucher? (Ketik: KALABARU)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-neutral-300 uppercase outline-none focus:border-black"
                      />
                      <button
                        onClick={applyPromo}
                        className="px-3 py-2 bg-neutral-200 text-xs font-bold rounded-lg hover:bg-neutral-300"
                      >
                        Pakai
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p className="text-[11px] text-red-500">{promoError}</p>
                  )}
                  {discountPercent > 0 && (
                    <p className="text-[11px] text-green-600 font-medium">
                      Voucher KALABARU aktif (Diskon 10%)
                    </p>
                  )}

                  <div className="space-y-1 text-xs pt-1">
                    <div className="flex justify-between text-neutral-500">
                      <span>Subtotal</span>
                      <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>Potongan Voucher</span>
                        <span>
                          -Rp {discountAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                      <span>Total</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {checkoutStep === 'cart' ? (
                    <button
                      onClick={() => setCheckoutStep('form')}
                      className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition"
                    >
                      Lanjut ke Checkout
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="px-4 py-3 bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        form="checkout-form"
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Phone size={14} />
                        Kirim Order ke WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-200 bg-white py-8 text-center text-xs text-neutral-400">
        <p>© 2026 KALA.STUDIOS. All rights reserved.</p>
      </footer>
    </div>
  );
}
