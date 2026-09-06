import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { Category, Product } from '../../types/index.js';
import { apiFetch } from '../../services/api.js';
import { ProductCard } from '../home/HomePage.js';
import { useCart } from '../../context/CartContext.js';
import { useFavorites } from '../../context/FavoritesContext.js';

interface CatalogPageProps {
  onNavigate: (view: string, param?: string) => void;
  param?: string; // Query string or search param e.g. "category=aneis"
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onNavigate, param }) => {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse param on load
  useEffect(() => {
    if (param) {
      const params = new URLSearchParams(param);
      if (params.get('category')) setSelectedCategory(params.get('category') || '');
      if (params.get('search')) setSearchQuery(params.get('search') || '');
      if (params.get('promocao')) setOnlyPromo(params.get('promocao') === 'true');
      if (params.get('sort')) setSortBy(params.get('sort') || 'relevance');
    }
    loadCategories();
  }, [param]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [selectedCategory, searchQuery, minPrice, maxPrice, onlyPromo, onlyInStock, sortBy, currentPage]);

  const loadCategories = async () => {
    try {
      const res = await apiFetch<{ categories: Category[] }>('/api/categories');
      setCategories(res.categories || []);
    } catch {}
  };

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.set('category', selectedCategory);
      if (searchQuery) queryParams.set('search', searchQuery);
      if (minPrice) queryParams.set('min_price', minPrice);
      if (maxPrice) queryParams.set('max_price', maxPrice);
      if (onlyPromo) queryParams.set('on_promo', 'true');
      if (onlyInStock) queryParams.set('in_stock', 'true');
      if (sortBy) queryParams.set('sort', sortBy);
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', '12');

      const res = await apiFetch<{
        products: Product[];
        pagination: { page: number; limit: number; total: number; total_pages: number };
      }>(`/api/products?${queryParams.toString()}`);

      setProducts(res.products || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setOnlyPromo(false);
    setOnlyInStock(false);
    setSortBy('relevance');
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumb */}
        <div className="mb-8 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
            Coleção Completa Aura
          </p>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#FAF8F5]">
            {selectedCategory
              ? categories.find((c) => c.slug === selectedCategory)?.name || 'Catálogo de Joias'
              : 'Catálogo de Joias Finas'}
          </h1>
          <p className="text-xs text-[#8C8A96]">
            Exibindo {totalItems} joias artesanais em Ouro 18k e Prata 925
          </p>
        </div>

        {/* Search Bar & Mobile Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-[#25252A]">
          <div className="relative flex-1 w-full max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar solitários, anéis, correntes ou pulseiras..."
              className="w-full bg-[#1A1A1E] text-xs text-[#FAF8F5] pl-4 pr-10 py-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#D4AF37] absolute right-3 top-3.5" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 bg-[#1A1A1E] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#3A3A40]"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" /> Filtros
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8C8A96] hidden sm:inline">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1A1A1E] text-xs text-[#FAF8F5] px-3 py-2.5 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none cursor-pointer"
              >
                <option value="relevance">Mais Relevantes</option>
                <option value="bestseller">Mais Vendidos</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="newest">Lançamentos</option>
                <option value="rating">Melhor Avaliados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6 bg-[#141416] p-6 rounded-2xl border border-[#25252A] h-fit`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#25252A]">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filtros de Busca
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-[#8C8A96] hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Limpar
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#FAF8F5]">Categorias</h4>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors ${
                    selectedCategory === '' ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold' : 'text-[#8C8A96] hover:text-white'
                  }`}
                >
                  Todas as Categorias
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === c.slug ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold' : 'text-[#8C8A96] hover:text-white'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2 pt-4 border-t border-[#25252A]">
              <h4 className="text-xs font-semibold text-[#FAF8F5]">Faixa de Preço (R$)</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-[#1A1A1E] text-xs p-2 rounded-lg border border-[#3A3A40] text-[#FAF8F5] focus:outline-none"
                />
                <span className="text-[#8C8A96]">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#1A1A1E] text-xs p-2 rounded-lg border border-[#3A3A40] text-[#FAF8F5] focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="space-y-3 pt-4 border-t border-[#25252A] text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={onlyPromo}
                  onChange={(e) => setOnlyPromo(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>Apenas Promoções e Ofertas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#FAF8F5]">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>Apenas Pronta Entrega (Em Estoque)</span>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 text-xs text-[#8C8A96]">
                Carregando catálogo de joias...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-[#141416] rounded-2xl border border-[#25252A] p-8 space-y-4">
                <p className="text-sm font-semibold text-[#FAF8F5]">Nenhum produto encontrado</p>
                <p className="text-xs text-[#8C8A96] max-w-sm mx-auto">
                  Tente alterar ou limpar seus filtros de busca para encontrar joias disponíveis.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-6 py-2.5 rounded-full"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod) => (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs transition-colors ${
                          currentPage === i + 1
                            ? 'bg-[#D4AF37] text-[#0F0F10]'
                            : 'bg-[#1A1A1E] text-[#FAF8F5] border border-[#3A3A40] hover:border-[#D4AF37]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
