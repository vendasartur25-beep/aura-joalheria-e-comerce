import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Heart,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Banner, Category, Product, Review } from '../../types/index.js';
import { apiFetch } from '../../services/api.js';
import { useCart } from '../../context/CartContext.js';
import { useFavorites } from '../../context/FavoritesContext.js';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [banRes, catRes, prodRes, revRes] = await Promise.all([
        apiFetch<{ banners: Banner[] }>('/api/banners'),
        apiFetch<{ categories: Category[] }>('/api/categories'),
        apiFetch<{ products: Product[] }>('/api/products?limit=12'),
        apiFetch<{ reviews: Review[] }>('/api/reviews'),
      ]);

      setBanners(banRes.banners || []);
      setCategories(catRes.categories || []);

      const allProds = prodRes.products || [];
      setFeaturedProducts(allProds.filter((p) => p.is_featured).slice(0, 4));
      setBestsellerProducts(allProds.filter((p) => p.is_bestseller).slice(0, 4));
      setReviews(revRes.reviews || []);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Banner carousel timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const activeBanner = banners[currentBannerIndex];

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen">
      {/* Hero Banner Carousel */}
      {activeBanner && (
        <section className="relative h-[500px] sm:h-[620px] bg-[#0A0A0B] overflow-hidden flex items-center">
          <div className="absolute inset-0">
            <img
              src={activeBanner.image_url}
              alt={activeBanner.title}
              className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F10] via-[#0F0F10]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
            <div className="max-w-xl space-y-6">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#D4AF37] font-semibold bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> Coleção Exclusiva Aura
              </span>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#FAF8F5] leading-[1.15] tracking-tight">
                {activeBanner.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#C5C5D0] leading-relaxed max-w-md">
                {activeBanner.subtitle}
              </p>

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={() => onNavigate('catalog')}
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-2xl hover:shadow-[#D4AF37]/20 transition-all flex items-center gap-2"
                >
                  {activeBanner.button_text} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Banner Controls */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 right-6 sm:right-12 flex items-center gap-2">
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                className="p-2.5 bg-[#1A1A1E]/80 hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white rounded-full border border-[#3A3A40] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                className="p-2.5 bg-[#1A1A1E]/80 hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white rounded-full border border-[#3A3A40] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Categorias Principais
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5]">
            Nossas Coleções em Ouro & Prata
          </h2>
          <div className="w-12 h-0.5 bg-[#D4AF37] mx-auto mt-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('catalog', `category=${cat.slug}`)}
              className="group cursor-pointer relative bg-[#141416] border border-[#25252A] rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-300 shadow-md hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden bg-[#1D1D22]">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
              </div>
              <div className="p-3 text-center">
                <h3 className="text-xs font-semibold text-[#FAF8F5] group-hover:text-[#D4AF37] transition-colors">
                  {cat.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-[#121214] py-16 border-y border-[#202025]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                Destaques Aura
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5]">
                Joias em Evidência
              </h2>
            </div>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
            >
              Ver Todo o Catálogo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
                onAddToCart={() => addToCart(product)}
                isFav={isFavorite(product.id)}
                onToggleFav={() => toggleFavorite(product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Hero Banner */}
      <section className="py-20 relative bg-gradient-to-r from-[#18181B] via-[#2A2315] to-[#18181B] overflow-hidden border-b border-[#3A3324]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-xl space-y-5 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-bold">
              Compromisso Aura Joias
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold leading-tight text-[#FAF8F5]">
              Sua Joia com Garantia Vitalícia & Certificado Oficial
            </h2>
            <p className="text-xs sm:text-sm text-[#C5C5D0] leading-relaxed">
              Cada peça acompanha estojo de veludo de alta gramatura, flanela mágica de polimento e certificado de autenticidade permanente do teor do metal precioso.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4" /> Garantia Vitalícia
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                <Award className="w-4 h-4" /> Ouro 18k / Prata 925
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                <Truck className="w-4 h-4" /> Envio Blindado
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm bg-[#141416] p-6 rounded-2xl border border-[#3A3324] shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-[#FAF8F5] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Por que comprar na Aura?
            </h3>
            <ul className="space-y-3 text-xs text-[#A0A0AA]">
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> 5% de desconto imediato em pagamentos via PIX.
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> Parcelamento em até 10x sem juros no cartão.
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> Primeira troca grátis sem complicações em 30 dias.
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> Atendimento personalizado via WhatsApp Concierge.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Mais Vendidos
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5]">
              Os Favoritos Nossos Clientes
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog', 'sort=bestseller')}
            className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
          >
            Ver Mais Vendidos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellerProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
              onAddToCart={() => addToCart(product)}
              isFav={isFavorite(product.id)}
              onToggleFav={() => toggleFavorite(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Customer Reviews & Testimonials */}
      {reviews.length > 0 && (
        <section className="bg-[#121214] py-16 border-t border-[#202025]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 mb-12">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                Depoimentos Verificados
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5]">
                O que Dizem Nossos Clientes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-[#1A1A1E] p-6 rounded-2xl border border-[#2D2D35] space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                      ))}
                    </div>
                    {rev.is_verified_buyer && (
                      <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 px-2.5 py-1 rounded-full border border-[#25D366]/30">
                        Comprador Verificado ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#D0C0B0] italic leading-relaxed">
                    "{rev.comment}"
                  </p>

                  <div className="pt-2 border-t border-[#2A2A30] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FAF8F5]">{rev.user_name}</span>
                    <span className="text-[10px] text-[#7A7A85]">{rev.product_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

/* Component: Product Card */
interface ProductCardProps {
  product: Product;
  onNavigate: (view: string, param?: string) => void;
  onAddToCart: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onAddToCart,
  isFav,
  onToggleFav,
}) => {
  const primaryImg = product.images[0]?.image_url;
  const secondaryImg = product.images[1]?.image_url || primaryImg;
  const isOutOfStock = product.available_stock === 0;

  return (
    <div className="group bg-[#141416] border border-[#25252A] rounded-2xl overflow-hidden hover:border-[#D4AF37]/60 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between">
      <div className="relative aspect-square bg-[#1A1A1E] overflow-hidden">
        {/* Images with hover effect */}
        <img
          src={primaryImg}
          alt={product.name}
          onClick={() => onNavigate('product', product.slug)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.promo_price && (
            <span className="bg-[#D4AF37] text-[#0F0F10] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
              Oferta
            </span>
          )}
          {product.is_bestseller && (
            <span className="bg-[#FAF8F5] text-[#0F0F10] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
              Mais Vendido
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={onToggleFav}
          className={`absolute top-3 right-3 p-2 rounded-full border transition-all z-10 ${
            isFav
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-[#0F0F10]/60 text-white border-white/20 hover:bg-[#D4AF37] hover:text-[#0F0F10]'
          }`}
          title="Adicionar aos Favoritos"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#8C8A96] font-medium">
            {product.category_name || product.material}
          </p>
          <h3
            onClick={() => onNavigate('product', product.slug)}
            className="text-xs font-semibold text-[#FAF8F5] group-hover:text-[#D4AF37] transition-colors line-clamp-2 cursor-pointer mt-0.5"
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-[#222226] space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#D4AF37]">
              R$ {(product.promo_price || product.price).toFixed(2)}
            </span>
            {product.promo_price && (
              <span className="text-[11px] text-[#7A7A85] line-through">
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-[10px] font-semibold text-[#25D366]">
            ⚡ R$ {product.pix_price.toFixed(2)} no PIX (5% OFF)
          </p>

          <p className="text-[10px] text-[#8C8A96]">
            ou 10x de R$ {((product.promo_price || product.price) / 10).toFixed(2)} sem juros
          </p>
        </div>

        <button
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className={`w-full mt-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            isOutOfStock
              ? 'bg-[#2A2A30] text-[#7A7A85] cursor-not-allowed'
              : 'bg-[#1A1A1E] hover:bg-[#D4AF37] text-[#FAF8F5] hover:text-[#0F0F10] border border-[#3A3A40]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {isOutOfStock ? 'Esgotado' : 'Comprar / Adicionar'}
        </button>
      </div>
    </div>
  );
};
