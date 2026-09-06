import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { FavoritesProvider } from './context/FavoritesContext.js';
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { CartDrawer } from './components/cart/CartDrawer.js';
import { AuthModal } from './components/auth/AuthModal.js';

import { HomePage } from './components/home/HomePage.js';
import { CatalogPage } from './components/catalog/CatalogPage.js';
import { ProductDetailPage } from './components/product/ProductDetailPage.js';
import { CheckoutPage } from './components/checkout/CheckoutPage.js';
import { AccountPage } from './components/account/AccountPage.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';

export default function App() {
  const [view, setView] = useState<'home' | 'catalog' | 'product' | 'checkout' | 'account' | 'admin'>('home');
  const [viewParam, setViewParam] = useState<string | undefined>();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleNavigate = (newView: string, param?: string) => {
    setView(newView as any);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#0F0F10] text-[#FAF8F5] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0F0F10]">
            {/* Header */}
            <Header
              onNavigate={handleNavigate}
              onOpenAuth={() => setAuthModalOpen(true)}
            />

            {/* Main View Router */}
            <main className="flex-1">
              {view === 'home' && <HomePage onNavigate={handleNavigate} />}

              {view === 'catalog' && (
                <CatalogPage onNavigate={handleNavigate} param={viewParam} />
              )}

              {view === 'product' && viewParam && (
                <ProductDetailPage slug={viewParam} onNavigate={handleNavigate} />
              )}

              {view === 'checkout' && (
                <CheckoutPage onNavigate={handleNavigate} />
              )}

              {view === 'account' && (
                <AccountPage onNavigate={handleNavigate} defaultTab={viewParam} />
              )}

              {view === 'admin' && (
                <AdminDashboard onNavigate={handleNavigate} />
              )}
            </main>

            {/* Cart Slide-Over Drawer */}
            <CartDrawer
              onCheckout={() => handleNavigate('checkout')}
              onContinueShopping={() => handleNavigate('catalog')}
            />

            {/* Auth Modal */}
            <AuthModal
              isOpen={authModalOpen}
              onClose={() => setAuthModalOpen(false)}
            />

            {/* Footer */}
            <Footer onNavigate={handleNavigate} />
          </div>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
