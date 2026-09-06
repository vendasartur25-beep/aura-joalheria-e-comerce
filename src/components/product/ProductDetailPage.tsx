import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  Star,
  CheckCircle,
  Award,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Product, Review } from '../../types/index.js';
import { apiFetch } from '../../services/api.js';
import { useCart } from '../../context/CartContext.js';
import { useFavorites } from '../../context/FavoritesContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { ProductCard } from '../home/HomePage.js';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');

  // Shipping
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ product: Product; reviews: Review[]; related: Product[] }>(
        `/api/products/${slug}`
      );
      setProduct(res.product);
      setReviews(res.reviews || []);
      setRelated(res.related || []);
      if (res.product.size) {
        setSelectedSize(res.product.size);
      }
    } catch (err: any) {
      alert('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-20 text-center text-xs">
        Carregando detalhes da joia...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-20 text-center space-y-4">
        <p className="text-sm font-semibold">Produto não encontrado.</p>
        <button onClick={() => onNavigate('catalog')} className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs px-6 py-2.5 rounded-full">
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const maxStock = product.available_stock ?? product.stock_quantity;
  const isOutOfStock = maxStock === 0;

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep.trim()) return;
    setShippingLoading(true);
    try {
      const res = await apiFetch<{ options: any[] }>('/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ cep, items_subtotal: product.promo_price || product.price }),
      });
      setShippingOptions(res.options);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShippingLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Faça login para publicar uma avaliação.');
      onNavigate('auth');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await apiFetch<{ review: Review; message: string }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      setReviews((prev) => [res.review, ...prev]);
      setReviewSuccess(res.message);
      setReviewComment('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const currentImg = product.images[selectedImageIndex]?.image_url || product.images[0]?.image_url;

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#8C8A96] mb-8 overflow-x-auto whitespace-nowrap">
          <span onClick={() => onNavigate('home')} className="hover:text-[#D4AF37] cursor-pointer">
            Início
          </span>
          <ChevronRight className="w-3 h-3" />
          <span onClick={() => onNavigate('catalog')} className="hover:text-[#D4AF37] cursor-pointer">
            Catálogo
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#FAF8F5] font-semibold">{product.name}</span>
        </div>

        {/* Product Detail Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-16 border-b border-[#25252A]">
          {/* Gallery Column */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-[#141416] border border-[#25252A] rounded-2xl overflow-hidden shadow-2xl">
              <img src={currentImg} alt={product.name} className="w-full h-full object-cover" />

              <button
                onClick={() => toggleFavorite(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full border transition-all z-10 ${
                  isFavorite(product.id)
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-[#0F0F10]/60 text-white border-white/20 hover:bg-[#D4AF37] hover:text-[#0F0F10]'
                }`}
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Thumbnail Row */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-[#D4AF37] scale-105' : 'border-[#2A2A30] opacity-60'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Buy Column */}
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                {product.category_name} • SKU: {product.sku}
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#FAF8F5] mt-1 leading-tight">
                {product.name}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating_avg) ? 'fill-[#D4AF37]' : 'text-[#333]'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#FAF8F5]">{product.rating_avg}</span>
                <span className="text-xs text-[#8C8A96]">({reviews.length} avaliações)</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-[#141416] p-5 rounded-2xl border border-[#25252A] space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                  R$ {(product.promo_price || product.price).toFixed(2)}
                </span>
                {product.promo_price && (
                  <span className="text-sm text-[#7A7A85] line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="p-3 bg-[#1A281E] border border-[#2D5A34] rounded-xl text-xs flex items-center justify-between">
                <span className="text-[#25D366] font-bold flex items-center gap-1">
                  ⚡ R$ {product.pix_price.toFixed(2)} à vista no PIX
                </span>
                <span className="bg-[#25D366]/20 text-[#25D366] font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                  5% OFF
                </span>
              </div>

              <p className="text-xs text-[#8C8A96]">
                ou em até <strong className="text-[#FAF8F5]">10x de R$ {((product.promo_price || product.price) / 10).toFixed(2)}</strong> sem juros no cartão de crédito.
              </p>
            </div>

            {/* Spec Attributes */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#161618] border border-[#2A2A30] rounded-xl">
                <span className="text-[#8C8A96] block text-[10px] uppercase">Material Nobre</span>
                <span className="font-semibold text-[#FAF8F5]">{product.material}</span>
              </div>
              <div className="p-3 bg-[#161618] border border-[#2A2A30] rounded-xl">
                <span className="text-[#8C8A96] block text-[10px] uppercase">Acabamento / Cor</span>
                <span className="font-semibold text-[#FAF8F5]">{product.color}</span>
              </div>
            </div>

            {/* Size Selector */}
            {product.size && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#FAF8F5]">Tamanho / Aro:</p>
                <div className="inline-block px-4 py-2 bg-[#1A1A1E] border border-[#D4AF37] text-[#D4AF37] font-semibold text-xs rounded-xl">
                  {product.size}
                </div>
              </div>
            )}

            {/* Stock Availability Alert */}
            <div>
              {isOutOfStock ? (
                <p className="text-xs font-bold text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/30">
                  ⚠️ Produto temporariamente esgotado em nosso estoque.
                </p>
              ) : (
                <p className="text-xs text-[#25D366] font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Em Estoque ({maxStock} unidades disponíveis para pronta entrega)
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => addToCart(product, undefined, quantity)}
                disabled={isOutOfStock}
                className="w-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {isOutOfStock ? 'Esgotado' : 'ADICIONAR AO CARRINHO'}
              </button>

              {!isOutOfStock && (
                <button
                  onClick={() => {
                    addToCart(product, undefined, quantity);
                    onNavigate('checkout');
                  }}
                  className="w-full bg-[#1A1A1E] hover:bg-[#25252A] text-[#FAF8F5] border border-[#3A3A40] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all"
                >
                  COMPRAR AGORA
                </button>
              )}
            </div>

            {/* Shipping Calculator */}
            <div className="pt-6 border-t border-[#25252A] space-y-3">
              <h4 className="text-xs font-semibold text-[#FAF8F5] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#D4AF37]" /> Calcular Frete e Prazo de Entrega
              </h4>

              <form onSubmit={handleCalculateShipping} className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="Informe seu CEP"
                  className="flex-1 bg-[#1A1A1E] text-xs text-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={shippingLoading}
                  className="bg-[#2A2A30] text-[#FAF8F5] text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3A3A40]"
                >
                  {shippingLoading ? '...' : 'Calcular'}
                </button>
              </form>

              {shippingOptions.length > 0 && (
                <div className="space-y-2 pt-2">
                  {shippingOptions.map((opt) => (
                    <div
                      key={opt.code}
                      className="flex items-center justify-between p-2.5 bg-[#141416] border border-[#25252A] rounded-xl text-xs"
                    >
                      <span>{opt.name} ({opt.delivery_days} dias úteis)</span>
                      <span className="font-bold text-[#D4AF37]">
                        {opt.price === 0 ? 'FRETE GRÁTIS' : `R$ ${opt.price.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="py-12 border-b border-[#25252A] space-y-4 max-w-3xl">
          <h3 className="text-base font-serif font-bold text-[#FAF8F5] uppercase tracking-wider">
            Descrição do Produto
          </h3>
          <p className="text-xs sm:text-sm text-[#C5C5D0] leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="py-12 border-b border-[#25252A] space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-[#FAF8F5] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#D4AF37]" /> Avaliações de Clientes ({reviews.length})
            </h3>
          </div>

          {/* Reviews List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#141416] p-5 rounded-2xl border border-[#25252A] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-[#D4AF37]' : 'text-[#333]'}`}
                      />
                    ))}
                  </div>
                  {rev.is_verified_buyer && (
                    <span className="text-[10px] text-[#25D366] font-bold">Comprador Verificado ✓</span>
                  )}
                </div>
                <p className="text-xs text-[#D0C0B0] italic">"{rev.comment}"</p>
                <p className="text-[10px] text-[#7A7A85] font-semibold">{rev.user_name}</p>
              </div>
            ))}
          </div>

          {/* Submit Review Form */}
          <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] max-w-lg space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              Deixe sua Avaliação
            </h4>

            {reviewSuccess && <p className="text-xs text-[#25D366] font-bold">{reviewSuccess}</p>}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#8C8A96] block mb-1">Nota:</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full bg-[#1A1A1E] text-xs text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excelente</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5) Muito Bom</option>
                  <option value={3}>⭐⭐⭐ (3/5) Bom</option>
                  <option value={2}>⭐⭐ (2/5) Regular</option>
                  <option value={1}>⭐ (1/5) Ruim</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8C8A96] block mb-1">Comentário:</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Conte sua experiência com esta joia..."
                  className="w-full bg-[#1A1A1E] text-xs text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-6 py-2.5 rounded-xl hover:bg-[#c5a028]"
              >
                {reviewSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
              </button>
            </form>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="pt-12 space-y-8">
            <h3 className="text-xl font-serif font-bold text-[#FAF8F5]">Você Também Pode Gostar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onNavigate={onNavigate}
                  onAddToCart={() => addToCart(prod)}
                  isFav={isFavorite(prod.id)}
                  onToggleFav={() => toggleFavorite(prod.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
