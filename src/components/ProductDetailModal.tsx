import React, { useState, useEffect } from 'react';
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
}

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: SizeKey) => void;
  formatRupiah: (amount: number) => string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  formatRupiah,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedSize, setSelectedSize] = useState<SizeKey>('M');
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (!product) return;
    setCurrentSlide(0);
    const firstAvailable = SIZES.find((sz) => (product.stock[sz] ?? 0) > 0);
    setSelectedSize(firstAvailable || 'M');
  }, [product]);

  if (!product) return null;

  const slideImages = Array.from(
    new Set([product.image, ...(product.images || [])].filter(Boolean))
  );

  const isAllSoldOut = SIZES.every((sz) => (product.stock[sz] ?? 0) <= 0);
  const activeStock = product.stock[selectedSize] ?? 0;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slideImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slideImages.length - 1 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const distance = touchStart - e.changedTouches[0].clientX;
    if (distance > 50) nextSlide();
    if (distance < -50) prevSlide();
    setTouchStart(null);
  };

  const handleAdd = () => {
    if (activeStock <= 0) {
      alert(`Maaf, ukuran ${selectedSize} sedang habis!`);
      return;
    }
    onAddToCart(product, selectedSize);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full text-neutral-900 shadow-sm transition cursor-pointer"
          aria-label="Tutup Detail"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Bagian Kiri: Multi-Slide Carousel */}
        <div
          className="relative bg-neutral-100 flex flex-col justify-between aspect-[4/5] md:aspect-auto overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={slideImages[currentSlide]}
            alt={`${product.name} - slide ${currentSlide + 1}`}
            className="w-full h-full object-cover"
          />

          {isAllSoldOut ? (
            <span className="absolute top-4 left-4 bg-neutral-900 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              SOLD OUT
            </span>
          ) : (
            product.tag && (
              <span className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                {product.tag}
              </span>
            )
          )}

          {slideImages.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/85 hover:bg-white rounded-full shadow-md transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-900" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/85 hover:bg-white rounded-full shadow-md transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-neutral-900" />
              </button>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                {currentSlide + 1} / {slideImages.length}
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 p-1.5 rounded-xl backdrop-blur-md max-w-[90%] overflow-x-auto">
                {slideImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-10 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                      currentSlide === idx
                        ? 'border-white scale-105'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bagian Kanan: Deskripsi & Pilih Size */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              {product.categoryLabel}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-neutral-900 mt-1">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-2.5 mt-2">
              <p className="text-xl font-black text-neutral-900">
                {formatRupiah(product.price)}
              </p>
              {product.originalPrice && (
                <p className="text-sm text-neutral-400 line-through">
                  {formatRupiah(product.originalPrice)}
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Deskripsi Produk
              </h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Tidak ada deskripsi produk.'}
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Pilih Ukuran
                </h3>
                <span
                  className={`text-[11px] font-medium ${
                    activeStock > 0
                      ? 'text-neutral-500'
                      : 'text-red-500 font-semibold'
                  }`}
                >
                  {activeStock > 0
                    ? `Sisa stok (${selectedSize}): ${activeStock} pcs`
                    : 'Stok habis'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 mt-2">
                {SIZES.map((sz) => {
                  const qty = product.stock[sz] ?? 0;
                  const outOfStock = qty <= 0;
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      disabled={outOfStock}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition ${
                        outOfStock
                          ? 'border-neutral-200 bg-neutral-50 text-neutral-300 line-through cursor-not-allowed'
                          : active
                          ? 'border-black bg-black text-white cursor-pointer'
                          : 'border-neutral-300 text-neutral-800 hover:border-black cursor-pointer'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            disabled={isAllSoldOut || activeStock <= 0}
            onClick={handleAdd}
            className="mt-8 w-full py-3.5 px-6 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {isAllSoldOut || activeStock <= 0
              ? 'Stok Habis'
              : 'Tambah ke Keranjang'}
          </button>
        </div>
      </div>
    </div>
  );
};
