import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, X, Plus, Minus, Phone, Lock, Trash2, Upload, LogOut, Image as ImageIcon, Save, QrCode, Copy, Check, CheckCircle2, Package, Download, Pencil, SearchX, RotateCcw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import {
  ProductDetailModal,
  type Product,
  type SizeKey,
  SIZES,
  type StockMap,
} from './components/ProductDetailModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminOrdersSection } from './components/AdminOrdersSection';
import { EditProductModal } from './components/EditProductModal';

const STORE_NAME_FIRST = 'WS';
const STORE_NAME_SECOND = 'STORE';
const WHATSAPP_NUMBER = '6282321942197';
const ADMIN_PASSWORD = 'ADMINWS312';

const SUPABASE_URL = 'https://pymfcglqwejqfixmhnlf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QqUkadWoEnWcCZMhLxfhjA_NcFS8yr-';

const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

interface CartItem extends Product {
  size: SizeKey;
  color?: string;
  quantity: number;
  selected?: boolean;
}

const CATEGORY_OPTIONS = [
  { key: 'tops', label: 'Kaos & Atasan' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'pants', label: 'Celana' },
  { key: 'accessories', label: 'Aksesori' },
];


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
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Cotton Combed 16s Heavyweight 235 GSM. Potongan boxy modern, kerah rib tebal anti melar.',
    stock: { S: 5, M: 8, L: 4, XL: 2 },
  },
];

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

const normalizeStock = (raw: any): StockMap => ({
  S: Number(raw?.S ?? 0),
  M: Number(raw?.M ?? 0),
  L: Number(raw?.L ?? 0),
  XL: Number(raw?.XL ?? 0),
});

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
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ws_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartToast, setCartToast] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('ws_store_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, SizeKey>>(
    {}
  );
  const [selectedProductModal, setSelectedProductModal] =
    useState<Product | null>(null);

  const [promoInput, setPromoInput] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  useEffect(() => {
    if (!isCartOpen) {
      setPromoInput('');
      setPromoApplied(false);
    }
  }, [isCartOpen]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});
  const [newColors, setNewColors] = useState<string>('');
  const [isQrisOpen, setIsQrisOpen] = useState<boolean>(false);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [isConfirmingOrder, setIsConfirmingOrder] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; total: number } | null>(null);
  const [copiedNominal, setCopiedNominal] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'products' | 'orders'>('products');
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [myOrderCodes, setMyOrderCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ws_my_order_codes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);


  useEffect(() => {
    if (!isAdminRoute || !isAdminLoggedIn || !supabase) return;
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }: any) => {
        if (typeof count === 'number') setPendingOrdersCount(count);
      });
  }, [isAdminRoute, isAdminLoggedIn, adminTab]);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('tops');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStock, setNewStock] = useState<StockMap>({
    S: 5,
    M: 10,
    L: 10,
    XL: 5,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [editingStocks, setEditingStocks] = useState<Record<string, StockMap>>(
    {}
  );
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

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
          images: Array.isArray(item.images) ? item.images : [item.image],
          description: item.description || '',
          stock: normalizeStock(item.stock),
        colors: Array.isArray(item.colors) ? item.colors : [],
        }));
        setProducts(mapped);

        const stockMap: Record<string, StockMap> = {};
        mapped.forEach((p) => {
          stockMap[p.id] = { ...p.stock };
        });
        setEditingStocks(stockMap);
      } else {
        setProducts([]);
      }
    }
    setIsLoadingProducts(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState<number>(0);
  const dragStartXRef = React.useRef<number>(0);
  const currentDragIdxRef = React.useRef<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = "";
  };

  const movePhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= imageFiles.length || fromIdx === toIdx) return;
    setImageFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setImagePreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const removePhoto = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      alert('Publishable Key Supabase belum diisi di dalam file App.tsx!');
      return;
    }
    if (imageFiles.length === 0) {
      alert('Pilih minimal 1 foto produk terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

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
          image: uploadedUrls[0],
          images: uploadedUrls,
          description: newDescription,
          stock: newStock,
          colors: newColors.split(',').map((c) => c.trim()).filter(Boolean),
        },
      ]);

      if (insertError) throw insertError;

      setNewName('');
      setNewPrice('');
      setNewOriginalPrice('');
      setNewTag('');
      setNewDescription('');
      setNewColors('');
      setNewStock({ S: 5, M: 10, L: 10, XL: 5 });
      setImageFiles([]);
      setImagePreviews([]);
      await fetchProducts();
      alert(
        `Produk & ${uploadedUrls.length} foto slide berhasil ditambahkan!`
      );
    } catch (err: any) {
      alert('Gagal upload produk: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (productId: string) => {
    if (!supabase) return;
    const updated = editingStocks[productId];
    if (!updated) return;

    setSavingStockId(productId);
    const { error } = await supabase
      .from('products')
      .update({ stock: updated })
      .eq('id', productId);

    setSavingStockId(null);
    if (error) {
      alert('Gagal update stok: ' + error.message);
    } else {
      await fetchProducts();
      alert('Stok berhasil diperbarui!');
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

  const getActiveSizeForProduct = (product: Product): SizeKey => {
    const chosen = selectedSizes[product.id];
    if (chosen && product.stock[chosen] > 0) return chosen;
    const firstAvailable = SIZES.find((sz) => product.stock[sz] > 0);
    return chosen || firstAvailable || 'M';
  };

  const selectedCart = cart.filter((item) => item.selected !== false);
  const selectedCount = selectedCart.reduce((sum, item) => sum + item.quantity, 0);
  const allCartSelected = cart.length > 0 && cart.every((item) => item.selected !== false);

  const addToCart = (product: Product, customSize?: SizeKey, customColor?: string, openDrawer = false) => {
    const size = customSize || getActiveSizeForProduct(product);
    const color = customColor !== undefined ? customColor : (selectedColors[product.id] || product.colors?.[0] || '');
    const availableStock = product.stock?.[size] ?? 0;
    if (availableStock <= 0) {
      alert(`Maaf, stok ukuran ${size} untuk ${product.name} sedang habis.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size && (i.color || '') === color);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > availableStock) {
        alert(`Stok ukuran ${size} hanya tersisa ${availableStock} pcs.`);
        return prev;
      }
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.size === size && (i.color || '') === color
            ? { ...i, quantity: i.quantity + 1, selected: true }
            : i
        );
      }
      return [...prev, { ...product, size, color, quantity: 1, selected: true }];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      setCartToast(`${product.name} (${size}${color ? ', ' + color : ''}) masuk keranjang`);
      setTimeout(() => setCartToast(''), 2500);
    }
  };

  const buyNow = (product: Product, customSize?: SizeKey, customColor?: string) => {
    addToCart(product, customSize, customColor, true);
  };

  const toggleCartItem = (id: string, size: SizeKey, color = '') => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && (item.color || '') === color
          ? { ...item, selected: item.selected === false ? true : false }
          : item
      )
    );
  };

  const toggleSelectAllCart = () => {
    const nextState = !allCartSelected;
    setCart((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  const updateQuantity = (id: string, size: SizeKey, delta: number, color = '') => {
    const targetProduct = products.find((p) => p.id === id);
    const maxStock = targetProduct?.stock?.[size] ?? 99;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id && item.size === size && (item.color || '') === color) {
            const nextQty = item.quantity + delta;
            if (nextQty > maxStock) {
              alert(`Stok ukuran ${size} tersisa ${maxStock} pcs.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setProofPreview(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenQris = () => {
    if (selectedCart.length === 0) {
      alert('Pilih minimal 1 barang di keranjang untuk di-checkout.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert('Mohon lengkapi Nama, No. HP/WhatsApp, dan Alamat pengiriman terlebih dahulu.');
      return;
    }
    setOrderSuccess(null);
    setProofPreview('');
    setIsQrisOpen(true);
  };

  const handleConfirmQrisOrder = async () => {
    if (selectedCart.length === 0) {
      alert('Pilih minimal 1 barang untuk dibayar.');
      return;
    }
    if (!proofPreview) {
      alert('Mohon upload foto bukti transfer terlebih dahulu.');
      return;
    }
    setIsConfirmingOrder(true);
    const orderCode = 'WS-' + Date.now().toString().slice(-6);
    const orderItems = selectedCart.map((i) => ({
      id: i.id, name: i.name, size: i.size, color: i.color || '', quantity: i.quantity, price: i.price
    }));
    const finalTotal = total;

    try {
      if (supabase) {
        await supabase.from('orders').insert([{
          order_code: orderCode,
          shipping_estimate: 'Estimasi dikirim dalam 1x24 jam setelah konfirmasi',
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          items: orderItems,
          subtotal,
          discount: promoApplied ? discount : 0,
          total: finalTotal,
          promo_code: promoApplied ? 'OFFICIALWS' : null,
          proof_url: proofPreview,
          status: 'pending',
        }]);
        const stockChanges: Record<string, StockMap> = {};
        selectedCart.forEach((item) => {
          const prod = products.find((p) => p.id === item.id);
          if (!prod) return;
          if (!stockChanges[item.id]) stockChanges[item.id] = { ...prod.stock };
          const cur = stockChanges[item.id][item.size] ?? 0;
          stockChanges[item.id][item.size] = Math.max(0, cur - item.quantity);
        });
        for (const [prodId, nextStock] of Object.entries(stockChanges)) {
          await supabase.from('products').update({ stock: nextStock }).eq('id', prodId);
        }
        setProducts((prev) => prev.map((p) => (stockChanges[p.id] ? { ...p, stock: stockChanges[p.id] } : p)));
      }

      await fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderCode,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          items: orderItems,
          subtotal,
          discount: promoApplied ? discount : 0,
          total: finalTotal,
          promoCode: promoApplied ? 'OFFICIALWS' : '',
          proofBase64: proofPreview,
        }),
      });

      setOrderSuccess({ id: orderCode, total: finalTotal });
      setMyOrderCodes((prev) => {
        const next = [orderCode, ...prev.filter((c) => c !== orderCode)];
        try { localStorage.setItem('ws_my_order_codes', JSON.stringify(next)); } catch {}
        return next;
      });
      setCart((prev) => prev.filter((item) => item.selected === false));
      setPromoInput('');
      setPromoApplied(false);
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat mengirim pesanan. Coba klik lagi ya.');
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  const subtotal = selectedCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = promoApplied ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal - discount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0) return;

    if (supabase) {
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.id);
        if (prod) {
          const updatedStock: StockMap = {
            ...prod.stock,
            [item.size]: Math.max(
              0,
              (prod.stock[item.size] ?? 0) - item.quantity
            ),
          };
          await supabase
            .from('products')
            .update({ stock: updatedStock })
            .eq('id', item.id);
        }
      }
      await fetchProducts();
    }

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
      (promoApplied
        ? `Diskon Promo OFFICIALWS (5%): -${formatRupiah(discount)}%0A`
        : '') +
      `*Total Bayar: ${formatRupiah(total)}*%0A%0A` +
      `Nama: ${customerName || '-'}%0A` +
      `Alamat Pengiriman: ${customerAddress || '-'}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  setPromoInput('');
  setPromoApplied(false);
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

    if (adminTab === 'orders') {
      return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
          <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-lg font-bold tracking-tight">
                  {STORE_NAME_FIRST}<span className="text-neutral-400">.</span>{STORE_NAME_SECOND}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider">Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setAdminTab('products')} className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition cursor-pointer">
                  Kelola Produk
                </button>
                <button type="button" onClick={() => setAdminTab('orders')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold cursor-pointer">
                  <Package className="w-3.5 h-3.5" /> Pesanan Masuk {pendingOrdersCount > 0 && <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-black text-[10px] font-bold inline-flex items-center justify-center">{pendingOrdersCount}</span>}
                </button>
                <button type="button" onClick={() => { window.location.hash = ''; }} className="hidden sm:inline-flex px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-xs font-medium text-neutral-600 transition cursor-pointer">
                  Lihat Toko
                </button>
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <AdminOrdersSection supabase={supabase} formatRupiah={formatRupiah} onPendingCountChange={setPendingOrdersCount} />
          </main>
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
              <button type="button" onClick={() => setAdminTab('orders')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer">
              <Package className="w-3.5 h-3.5" /> Pesanan Masuk {pendingOrdersCount > 0 && <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-black text-[10px] font-bold inline-flex items-center justify-center">{pendingOrdersCount}</span>}
            </button>
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
        <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} supabase={supabase} onUpdated={(updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))} />

        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
          <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Produk Baru
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Foto Produk (Bisa pilih lebih dari 1 foto buat slide) *
                </label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl p-4 hover:border-black transition bg-neutral-50">
                  {imagePreviews.length > 0 ? (
                    <div className="w-full space-y-2.5">
                      <div className="flex gap-3 overflow-x-auto pb-1 justify-center">
                        {imagePreviews.map((src, idx) => (
                          <div
                            key={idx}
                            onPointerDown={(e) => {
                              if ((e.target as HTMLElement).closest("button")) return;
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                              dragStartXRef.current = e.clientX;
                              currentDragIdxRef.current = idx;
                              setDraggingIdx(idx);
                              setDragOffsetX(0);
                            }}
                            onPointerMove={(e) => {
                              const cur = currentDragIdxRef.current;
                              if (cur === null) return;
                              const deltaX = e.clientX - dragStartXRef.current;
                              const slotWidth = 124;
                              if (deltaX > slotWidth / 2 && cur < imagePreviews.length - 1) {
                                movePhoto(cur, cur + 1);
                                dragStartXRef.current += slotWidth;
                                currentDragIdxRef.current = cur + 1;
                                setDraggingIdx(cur + 1);
                                setDragOffsetX(e.clientX - dragStartXRef.current);
                              } else if (deltaX < -slotWidth / 2 && cur > 0) {
                                movePhoto(cur, cur - 1);
                                dragStartXRef.current -= slotWidth;
                                currentDragIdxRef.current = cur - 1;
                                setDraggingIdx(cur - 1);
                                setDragOffsetX(e.clientX - dragStartXRef.current);
                              } else {
                                setDragOffsetX(deltaX);
                              }
                            }}
                            onPointerUp={() => {
                              currentDragIdxRef.current = null;
                              setDraggingIdx(null);
                              setDragOffsetX(0);
                            }}
                            onPointerCancel={() => {
                              currentDragIdxRef.current = null;
                              setDraggingIdx(null);
                              setDragOffsetX(0);
                            }}
                            style={
                              draggingIdx === idx
                                ? { transform: `translateX(${dragOffsetX}px) scale(1.04)`, zIndex: 30 }
                                : undefined
                            }
                            className={`relative shrink-0 touch-none select-none cursor-grab active:cursor-grabbing rounded-lg ${
                              draggingIdx === idx ? "shadow-xl ring-2 ring-black" : "transition-transform"
                            }`}
                          >
                            <img
                              src={src}
                              alt={`Preview ${idx + 1}`}
                              draggable={false}
                              className="h-36 w-28 object-cover rounded-lg border border-neutral-200 pointer-events-none select-none"
                            />
                            {idx === 0 ? (
                              <span className="absolute top-1.5 left-1.5 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
                                Utama
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => movePhoto(idx, 0)}
                                title="Jadikan foto utama"
                                className="absolute top-1.5 left-1.5 bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-md"
                              >
                                Set Utama
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              title="Hapus foto"
                              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center hover:bg-red-700"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between">
                              <button
                                type="button"
                                onClick={() => movePhoto(idx, idx - 1)}
                                disabled={idx === 0}
                                className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] disabled:opacity-25"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => movePhoto(idx, idx + 1)}
                                disabled={idx === imagePreviews.length - 1}
                                className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] disabled:opacity-25"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        ))}
                        <label
                          htmlFor="product-photo-input"
                          className="h-36 w-28 shrink-0 rounded-lg border-2 border-dashed border-neutral-300 hover:border-black flex flex-col items-center justify-center cursor-pointer text-neutral-500 hover:text-black transition bg-white"
                        >
                          <span className="text-xl font-semibold leading-none">+</span>
                          <span className="text-[11px] font-medium mt-1">Tambah Foto</span>
                        </label>
                      </div>
                      <p className="text-[11px] text-center text-neutral-500">
                        {imagePreviews.length} foto dipilih • Geser (drag) foto untuk atur urutan slide
                      </p>
                    </div>
                  ) : (
                    <label htmlFor="product-photo-input" className="w-full text-center py-4 cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs font-medium text-neutral-700">
                        Klik untuk pilih 1 atau banyak foto baju
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        JPG, PNG, atau WEBP (Foto pertama jadi sampul utama)
                      </p>
                    </label>
                  )}
                  <input
                    id="product-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
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
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Stok Tersedia per Ukuran (Isi 0 jika ukuran tidak tersedia) *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {SIZES.map((sz) => (
                    <div
                      key={sz}
                      className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-center"
                    >
                      <span className="block text-xs font-black text-neutral-700 mb-1">
                        Size {sz}
                      </span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={newStock[sz]}
                        onChange={(e) =>
                          setNewStock((prev) => ({
                            ...prev,
                            [sz]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-full text-center font-bold text-sm px-2 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-black"
                      />
                    </div>
                  ))}
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
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Contoh: Cotton Combed 16s 235 GSM, cutting boxy..."
                  className="w-full px-3.5 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-black"
                />
              </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Pilihan Warna (pisahkan dengan koma)</label>
                    <input type="text" value={newColors} onChange={(e) => setNewColors(e.target.value)} placeholder="Contoh: Hitam, Putih, Navy, Cream" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900" />
                  </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-black text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isSubmitting
                  ? `Sedang Mengupload ${imageFiles.length} Foto...`
                  : 'Upload & Tampilkan di Toko'}
              </button>
            </form>
          </section>

          <section className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-base mb-4">
              Daftar Produk & Kelola Stok ({products.length})
            </h2>

            {products.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                Belum ada produk di database. Silakan tambah produk di atas.
              </p>
            ) : (
              <div className="divide-y divide-neutral-200">
                {products.map((item) => {
                  const currentEdit = editingStocks[item.id] || item.stock;
                  return (
                    <div key={item.id} className="py-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
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
                              {item.images && item.images.length > 1
                                ? ` • ${item.images.length} slide`
                                : ''}
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

                      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-2">
                          {SIZES.map((sz) => (
                            <div key={sz} className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-neutral-500">
                                {sz}:
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={currentEdit[sz]}
                                onChange={(e) =>
                                  setEditingStocks((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...currentEdit,
                                      [sz]: Math.max(0, Number(e.target.value)),
                                    },
                                  }))
                                }
                                className="w-12 text-center text-xs font-bold py-1 bg-white border border-neutral-300 rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleUpdateStock(item.id)}
                          disabled={savingStockId === item.id}
                          className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingStockId === item.id
                            ? 'Menyimpan...'
                            : 'Simpan Stok'}
                        </button>
                        <button type="button" onClick={() => setEditingProduct(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-xs font-medium text-neutral-700 transition cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased selection:bg-zinc-950 selection:text-white flex flex-col relative">
      {/* FIXED SOFT MESH + MARQUEE BACKGROUND (z-0, 200% Intensity) */}
      <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-white">
        <div className="absolute inset-0">
          <div
            className="absolute -top-24 -left-20 w-[46vw] h-[46vw] max-w-[620px] max-h-[620px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(246, 232, 213, 0.92) 0%, rgba(246, 232, 213, 0) 70%)' }}
          />
          <div
            className="absolute top-[18%] -right-24 w-[44vw] h-[44vw] max-w-[580px] max-h-[580px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(235, 228, 240, 0.88) 0%, rgba(235, 228, 240, 0) 70%)' }}
          />
          <div
            className="absolute -bottom-28 left-[28%] w-[52vw] h-[42vw] max-w-[680px] max-h-[520px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(243, 238, 229, 0.95) 0%, rgba(243, 238, 229, 0) 72%)' }}
          />
        </div>

        <div className="absolute inset-0 flex flex-col justify-center gap-12 sm:gap-16 overflow-hidden">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="w-full overflow-hidden">
              <div className={row % 2 === 0 ? 'marquee-track-left' : 'marquee-track-right'}>
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="font-display font-bold text-5xl sm:text-6xl md:text-7xl tracking-[0.16em] uppercase mx-8 whitespace-nowrap text-zinc-950/[0.085]"
                      >
                        WS.STORE
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOREGROUND CONTENT (z-10) */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Sticky Frosted White Navbar */}
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a
              href="#top"
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="flex items-center gap-2.5 group"
            >
              <span className="w-2 h-2 rounded-full bg-zinc-950 group-hover:scale-125 transition-transform" />
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-zinc-950">
                {STORE_NAME_FIRST}.{STORE_NAME_SECOND}
              </span>
            </a>

            {/* Keranjang FIRST, Pesanan at FAR RIGHT EDGE */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs sm:text-sm font-medium text-zinc-900 transition-colors cursor-pointer"
                aria-label="Keranjang Belanja"
              >
                <ShoppingBag className="w-4 h-4 text-zinc-800" />
                <span className="hidden sm:inline">Keranjang</span>
                {totalItems > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-zinc-950 text-white text-[11px] font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOrdersOpen(true)}
                className="relative inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs sm:text-sm font-medium text-zinc-900 transition-colors cursor-pointer"
                aria-label="Lacak Pesanan"
              >
                <Package className="w-4 h-4 text-zinc-800" />
                <span>Pesanan</span>
                {myOrderCodes.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {myOrderCodes.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
          {/* Minimal Hero Section */}
          <section className="text-center max-w-4xl mx-auto pt-4 pb-8 sm:pt-6 sm:pb-10">
            <h1 className="font-display font-bold text-zinc-950 leading-none uppercase tracking-[0.06em] text-4xl sm:text-5xl md:text-6xl select-none">
              ESSENTIAL WEAR
            </h1>
          </section>

          {/* Centered Minimalist Smart Search Bar */}
          <section aria-label="Pencarian Produk" className="mb-9 sm:mb-11">
            <div className="relative w-full max-w-lg mx-auto">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari baju, celana, jaket, topi, atau warna..."
                className="w-full pl-11 pr-11 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200 focus:border-zinc-900 focus:outline-none text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Product Catalog Section */}
          <section id="katalog" className="scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-zinc-200 pb-4">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-zinc-950">
                {searchQuery.trim() ? `Hasil untuk "${searchQuery.trim()}"` : 'Semua Produk'}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 font-medium">{filteredProducts.length} Item</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/90 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
                >
                  <option value="default">Terbaru</option>
                  <option value="price-asc">Harga: Terendah</option>
                  <option value="price-desc">Harga: Tertinggi</option>
                </select>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl bg-white/90 border border-zinc-200 overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] bg-zinc-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-zinc-100 rounded w-1/3" />
                      <div className="h-4 bg-zinc-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xs py-14 px-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-3.5">
                  <SearchX className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="font-display font-semibold text-base text-zinc-950 mb-1.5">
                  Produk tidak ditemukan.
                </p>
                <p className="text-xs text-zinc-500 mb-5">
                  Coba kata kunci lain seperti baju, celana, jaket, topi, atau warna.
                </p>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Pencarian</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {[...filteredProducts]
                  .sort((a, b) => sortBy === 'price-asc' ? a.price - b.price : sortBy === 'price-desc' ? b.price - a.price : 0)
                  .map((product) => {
                    void setSelectedSizes;
                    const isSoldOut = SIZES.every((sz) => (product.stock?.[sz] ?? 0) <= 0);
                    const images = product.images?.length ? product.images : product.image ? [product.image] : [];
                    const origPrice = product.originalPrice ?? (product as any).original_price;
                    const colors = product.colors || [];
                    const activeColor = selectedColors[product.id] || colors[0] || '';

                    return (
                      <article
                        key={product.id}
                        onClick={() => setSelectedProductModal(product)}
                        className="group rounded-2xl bg-white/90 backdrop-blur-sm border border-zinc-200 hover:border-zinc-400 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="relative aspect-[4/5] bg-zinc-100 border-b border-zinc-200/80 overflow-hidden">
                            {images[0] ? (
                              <img
                                src={images[0]}
                                alt={product.name}
                                className={`w-full h-full object-cover transition duration-500 ${images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">No Image</div>
                            )}
                            {images[1] && (
                              <img
                                src={images[1]}
                                alt={`${product.name} - 2`}
                                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                              />
                            )}
                            <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/90 border border-zinc-200 text-[10px] font-display font-medium tracking-wide text-zinc-700 shadow-xs">
                              {isSoldOut ? 'Habis' : product.category}
                            </span>
                            {!isSoldOut && origPrice && origPrice > product.price && (
                              <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 py-0.5 rounded-md bg-zinc-950 text-white text-[10px] font-bold uppercase">
                                Sale
                              </span>
                            )}
                            {images.length > 1 && (
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/85 border border-zinc-200 text-[10px] text-zinc-700">
                                1/{images.length}
                              </span>
                            )}
                          </div>

                          <div className="p-3.5 sm:p-4 pb-2">
                            <h3 className="font-semibold text-xs sm:text-[15px] text-zinc-900 leading-snug mb-1 group-hover:text-black transition-colors line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <span className="font-display font-bold text-sm sm:text-base text-zinc-950">
                                {formatRupiah(product.price)}
                              </span>
                              {origPrice && origPrice > product.price && (
                                <span className="text-xs text-zinc-600 font-medium line-through">
                                  {formatRupiah(origPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {colors.length > 0 && (
                          <div className="px-3.5 sm:px-4 pb-3.5 pt-1 flex flex-wrap gap-1.5">
                            {colors.map((c) => {
                              return (
                                <span
                                  key={c}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedColors((p) => ({ ...p, [product.id]: c }));
                                    setSelectedProductModal(product);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition ${activeColor === c ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400'}`}
                                >
                                  {c}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Minimal Footer */}
          <footer className="mt-16 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <span className="font-display tracking-wide">© 2026 {STORE_NAME_FIRST}.{STORE_NAME_SECOND} — Official Olshop</span>
            <span>Gunakan kode <strong className="text-zinc-900">OFFICIALWS</strong> untuk diskon 5%</span>
          </footer>
        </main>
      </div>

      {/* TOAST NOTIFICATION */}
      {cartToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950 text-white text-xs shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-xs">{cartToast}</span>
          <button
            type="button"
            onClick={() => { setCartToast(''); setIsCartOpen(true); }}
            className="underline font-semibold hover:text-zinc-300 shrink-0 cursor-pointer"
          >
            Lihat
          </button>
        </div>
      )}

      {/* MODALS */}
      <OrderTrackingModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        supabase={supabase}
        formatRupiah={formatRupiah}
        savedOrderCodes={myOrderCodes}
      />

      <ProductDetailModal
        product={selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
        onAddToCart={(product, size, color) => addToCart(product, size, color, false)}
        onBuyNow={(product, size, color) => buyNow(product, size, color)}
        formatRupiah={formatRupiah}
      />

      {/* SLIDE-OVER CART DRAWER (Light Mode) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
          <div
            className="w-full max-w-md bg-white border-l border-zinc-200 h-full flex flex-col justify-between p-5 sm:p-6 overflow-y-auto text-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <h2 className="font-display text-lg font-bold text-zinc-950">Keranjang ({totalItems})</h2>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-950 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto" />
                  <p className="text-sm text-zinc-500">Keranjang belanja masih kosong.</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-semibold cursor-pointer"
                  >
                    Mulai Belanja
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <label className="flex items-center justify-between pb-2.5 mb-1 border-b border-zinc-200 cursor-pointer select-none">
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700">
                      <input
                        type="checkbox"
                        checked={allCartSelected}
                        onChange={toggleSelectAllCart}
                        className="w-4 h-4 accent-zinc-950 rounded cursor-pointer"
                      />
                      Pilih Semua ({selectedCart.length}/{cart.length})
                    </span>
                    <span className="text-[11px] text-zinc-400">{selectedCount} pcs dipilih</span>
                  </label>
                  <div className="divide-y divide-zinc-100">
                    {cart.map((item) => {
                      const thumb = item.images?.length ? item.images[0] : item.image || '';
                      const isChecked = item.selected !== false;
                      return (
                        <div key={`${item.id}-${item.size}-${item.color || ''}`} className={`py-3.5 flex items-start gap-3 transition ${isChecked ? '' : 'opacity-50'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCartItem(item.id, item.size, item.color || '')}
                            className="mt-1.5 w-4 h-4 accent-zinc-950 rounded shrink-0 cursor-pointer"
                          />
                          <img src={thumb} alt={item.name} className="w-16 h-20 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-zinc-950 truncate">{item.name}</h4>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.size, -item.quantity, item.color || '')}
                                className="text-zinc-400 hover:text-red-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Size: <span className="text-zinc-800 font-medium">{item.size}</span>
                              {item.color && <> • Warna: <span className="text-zinc-800 font-medium">{item.color}</span></>}
                            </p>
                            <p className="font-display text-xs sm:text-sm font-bold text-zinc-950 mt-1">{formatRupiah(item.price)}</p>
                            <div className="inline-flex items-center gap-2.5 mt-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1">
                              <button type="button" onClick={() => updateQuantity(item.id, item.size, -1, item.color || '')} className="text-zinc-600 hover:text-zinc-950 cursor-pointer"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.id, item.size, 1, item.color || '')} className="text-zinc-600 hover:text-zinc-950 cursor-pointer"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-zinc-200 pt-4 mt-4 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoComplete="off"
                    name="promo_code_entry"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value); if (promoApplied) setPromoApplied(false); }}
                    placeholder="Kode promo (OFFICIALWS)"
                    className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (promoInput.trim().toUpperCase() === 'OFFICIALWS') {
                        setPromoApplied(true);
                      } else {
                        setPromoApplied(false);
                        if (promoInput.trim()) alert('Kode promo tidak valid!');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Pakai
                  </button>
                </div>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama penerima..." className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none" />
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="No. HP / WhatsApp penerima..." className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none" />
                <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Alamat lengkap pengiriman..." className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none" />
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span className="text-zinc-900 font-medium">{formatRupiah(subtotal)}</span></div>
                  <div className="flex justify-between text-zinc-500"><span>Ongkos Kirim</span><span className="text-zinc-700">Belum termasuk (bayar di tujuan / info WA)</span></div>
                  {promoApplied && <div className="flex justify-between text-emerald-700 font-medium"><span>Diskon OFFICIALWS (5%)</span><span>-{formatRupiah(discount)}</span></div>}
                  <div className="flex justify-between text-sm font-bold text-zinc-950 pt-1.5 border-t border-zinc-200"><span>Total Bayar</span><span className="font-display text-base">{formatRupiah(total)}</span></div>
                </div>
                <button
                  type="button"
                  disabled={selectedCart.length === 0}
                  onClick={handleOpenQris}
                  className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-zinc-950/10"
                >
                  <ShoppingBag className="w-4 h-4" /> {selectedCart.length === 0 ? 'Pilih Barang Dulu' : `Lanjut ke Pembayaran (${selectedCount})`}
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="w-full py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-950 font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" /> Tanya / Pesan via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT POPUP MODAL (Light Mode + QRIS + Bukti TF) */}
      {isQrisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4" onClick={() => !isConfirmingOrder && setIsQrisOpen(false)}>
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-zinc-200 p-5 sm:p-6 text-zinc-950 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-zinc-950" />
                <h3 className="font-display text-base sm:text-lg font-bold text-zinc-950">Selesaikan Pembayaran</h3>
              </div>
              <button type="button" onClick={() => setIsQrisOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 hover:text-zinc-950 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {orderSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                <h4 className="font-display text-xl font-bold text-zinc-950">Pesanan Diterima!</h4>
                <p className="text-xs text-zinc-500">Kode Order: <strong className="text-zinc-950 font-mono">{orderSuccess.id}</strong></p>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Bukti transfer sebesar <strong className="text-zinc-950">{formatRupiah(orderSuccess.total)}</strong> sudah otomatis diterima admin. Kami akan segera memproses pesanan kamu.
                </p>
                <div className="space-y-2 pt-2">
                  <button type="button" onClick={() => { setIsQrisOpen(false); setIsOrdersOpen(true); }} className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition cursor-pointer">
                    Lihat Status &amp; Jadwal Pengiriman
                  </button>
                  <button type="button" onClick={() => setIsQrisOpen(false)} className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-xs transition cursor-pointer">
                    Kembali ke Toko
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-500">Total yang harus dibayar</p>
                    <p className="font-display text-xl font-bold text-zinc-950">{formatRupiah(total)}</p>
                  </div>
                  <button type="button" onClick={() => { navigator.clipboard?.writeText(String(total)); setCopiedNominal(true); setTimeout(() => setCopiedNominal(false), 1800); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 text-[11px] font-medium text-zinc-800 transition cursor-pointer">
                    {copiedNominal ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin Nominal</>}
                  </button>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col items-center">
                  <img src="/qris.png" alt="QRIS WS.STORE" className="w-full max-w-[260px] rounded-lg object-contain bg-white p-2 border border-zinc-100" />
                  <p className="text-[11px] text-zinc-500 mt-2 text-center">Scan kode di atas pakai aplikasi bank atau e-wallet apa saja</p>
                  <a href="/qris.png" download="QRIS-WS-STORE.png" className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-semibold transition">
                    <Download className="w-3.5 h-3.5" /> Simpan Gambar QRIS
                  </a>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-700">Upload Bukti Transfer (Wajib)</label>
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-xl p-4 cursor-pointer bg-zinc-50 transition">
                    {proofPreview ? (
                      <img src={proofPreview} alt="Bukti Transfer" className="max-h-44 rounded-lg object-contain" />
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="w-5 h-5 text-zinc-700 mx-auto" />
                        <p className="text-xs text-zinc-800 font-medium">Pilih foto / screenshot bukti bayar</p>
                        <p className="text-[10px] text-zinc-400">JPG / PNG</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleProofFileChange} className="hidden" />
                  </label>
                </div>

                <button type="button" disabled={isConfirmingOrder || !proofPreview} onClick={handleConfirmQrisOrder} className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs sm:text-sm transition cursor-pointer disabled:cursor-not-allowed">
                  {isConfirmingOrder ? 'Mengirim Pesanan...' : 'Konfirmasi Pembayaran'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
