import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  ShieldCheck,
  Percent,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useFavorites } from '../../context/FavoritesContext.js';

interface HeaderProps {
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { setIsCartOpen, itemsCount } = useCart();
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', `search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const navCategories = [
    { label: 'Todos os Produtos', action: () => onNavigate('catalog') },
    { label: 'Anéis', action: () => onNavigate('catalog', 'category=aneis') },
    { label: 'Correntes & Colares', action: () => onNavigate('catalog', 'category=correntes-colares') },
    { label: 'Pulseiras', action: () => onNavigate('catalog', 'category=pulseiras') },
    { label: 'Brincos', action: () => onNavigate('catalog', 'category=brincos') },
    { label: 'Pingentes', action: () => onNavigate('catalog', 'category=pingentes') },
    { label: 'Kits', action: () => onNavigate('catalog', 'category=kits') },
    { label: 'Promoções ⚡', action: () => onNavigate('catalog', 'promocao=true'), highlight: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0F0F10] text-[#FAF8F5] border-b border-[#2A2A2E] shadow-xl">
      {/* Top Banner Announcement */}
      <div className="bg-gradient-to-r from-[#1A1A1E] via-[#2D281E] to-[#1A1A1E] text-xs py-2 px-4 text-center tracking-wider text-[#D4AF37] border-b border-[#3A3322]/50 flex items-center justify-center gap-6 overflow-hidden">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Frete Grátis acima de R$ 500 para todo o Brasil
        </span>
        <span className="hidden md:inline text-[#5A5242]">•</span>
        <span className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
          <Percent className="w-3.5 h-3.5 text-[#D4AF37]" /> 5% de Desconto Extra no PIX
        </span>
        <span className="hidden lg:inline text-[#5A5242]">•</span>
        <span className="hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap text-[#E2D4B7]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Garantia Vitalícia do Ouro 18k e Prata 925
        </span>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#D4AF37] hover:text-white transition-colors"
          aria-label="Menu principal"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="cursor-pointer group flex flex-col items-center lg:items-start select-none"
        >
          <span className="text-2xl sm:text-3xl font-serif font-semibold tracking-[0.25em] text-[#FAF8F5] group-hover:text-[#D4AF37] transition-colors">
            AURA
          </span>
          <span className="text-[9px] tracking-[0.4em] uppercase text-[#D4AF37] font-sans -mt-1 font-medium">
            Alta Joalheria
          </span>
        </div>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md mx-8 relative items-center"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por solitários, rivieras, brincos ou ouro 18k..."
            className="w-full bg-[#1A1A1E] text-[#FAF8F5] text-sm pl-4 pr-10 py-2.5 rounded-full border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none placeholder-[#7A7A85] transition-all"
          />
          <button
            type="submit"
            className="absolute right-3 text-[#D4AF37] hover:text-white p-1 transition-colors"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Right Actions Header */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-[#FAF8F5] hover:text-[#D4AF37] transition-colors"
            aria-label="Buscar produtos"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist Favorites */}
          <button
            onClick={() => onNavigate('account', 'favorites')}
            className="relative p-2 text-[#FAF8F5] hover:text-[#D4AF37] transition-colors"
            title="Meus Favoritos"
          >
            <Heart className="w-5 h-5" />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#D4AF37] text-[#0F0F10] font-bold text-[10px] rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {/* User Account / Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!user) {
                  onNavigate('auth');
                } else {
                  setUserDropdownOpen(!userDropdownOpen);
                }
              }}
              className="flex items-center gap-2 p-2 text-[#FAF8F5] hover:text-[#D4AF37] transition-colors focus:outline-none"
            >
              <UserIcon className="w-5 h-5" />
              {user && (
                <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate text-[#E2D4B7]">
                  {user.name.split(' ')[0]}
                </span>
              )}
            </button>

            {/* Dropdown Menu if Logged In */}
            {user && userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1A1A1E] text-[#FAF8F5] border border-[#3A3A40] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-[#2A2A2E]">
                  <p className="text-xs font-semibold text-[#FAF8F5] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#A0A0AA] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigate('account', 'orders');
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-[#2A2A2E] flex items-center gap-2 transition-colors"
                >
                  <Package className="w-4 h-4 text-[#D4AF37]" /> Meus Pedidos
                </button>

                {(user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'SUPPORT') && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#D4AF37] hover:bg-[#2A2A2E] font-medium flex items-center gap-2 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Painel Administrativo
                  </button>
                )}

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    onNavigate('home');
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[#2A2A2E] flex items-center gap-2 border-t border-[#2A2A2E] transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sair da Conta
                </button>
              </div>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 bg-[#1A1A1E] hover:bg-[#2A2A2E] text-[#FAF8F5] px-3.5 py-2 rounded-full border border-[#3A3A40] hover:border-[#D4AF37] transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline text-xs font-medium tracking-wide">Carrinho</span>
            {itemsCount > 0 && (
              <span className="bg-[#D4AF37] text-[#0F0F10] font-bold text-[11px] px-2 py-0.5 rounded-full">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Input Overlay */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar solitários, rivieras ou ouro..."
              className="w-full bg-[#1A1A1E] text-[#FAF8F5] text-sm pl-4 pr-10 py-2 rounded-lg border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
              autoFocus
            />
            <button type="submit" className="absolute right-3 text-[#D4AF37]">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Categories Sub-nav - Desktop */}
      <nav className="hidden lg:block bg-[#141416] border-t border-[#25252A]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-8 py-3 text-xs tracking-wider uppercase">
          {navCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={cat.action}
              className={`hover:text-[#D4AF37] transition-colors relative py-1 font-medium ${
                cat.highlight ? 'text-[#D4AF37] font-semibold' : 'text-[#C5C5D0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#141416] border-t border-[#2A2A2E] px-6 py-6 space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">Navegar Categorias</p>
          <div className="grid grid-cols-1 gap-2">
            {navCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => {
                  cat.action();
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm py-2 px-3 rounded-lg hover:bg-[#25252A] transition-colors flex items-center justify-between ${
                  cat.highlight ? 'text-[#D4AF37] font-semibold' : 'text-[#FAF8F5]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-xs text-[#7A7A85]">→</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#25252A] space-y-2 text-xs">
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('account');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-[#FAF8F5] flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-[#D4AF37]" /> Minha Conta ({user.name.split(' ')[0]})
                </button>
                {user.role !== 'CUSTOMER' && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-[#D4AF37] font-semibold flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Painel de Administração
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-400 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigate('auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#D4AF37] text-[#0F0F10] font-semibold py-2.5 rounded-lg text-center tracking-wider text-xs uppercase mt-2"
              >
                Entrar ou Criar Conta
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
