import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant, CartItem, ShippingQuote } from '../types/index.js';
import { apiFetch } from '../services/api.js';

interface AppliedCoupon {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  discount_amount: number;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  coupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  shipping: ShippingQuote | null;
  setShipping: (quote: ShippingQuote | null) => void;
  subtotal: number;
  discount: number;
  total: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aura_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  // Recalculate coupon discount if items change
  const discount = coupon ? Math.min(coupon.discount_amount, subtotal) : 0;
  const shippingCost = shipping ? shipping.price : 0;
  const total = Math.max(0, subtotal - discount + shippingCost);

  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && (variant ? i.variant?.id === variant.id : !i.variant)
      );

      const maxStock = product.available_stock ?? product.stock_quantity;

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const targetQty = Math.min(maxStock, currentQty + quantity);
        updated[existingIndex].quantity = targetQty;
        return updated;
      } else {
        const targetQty = Math.min(maxStock, quantity);
        const newItem: CartItem = {
          id: `item_${product.id}_${variant ? variant.id : 'base'}`,
          product,
          variant,
          quantity: targetQty,
          unit_price: product.promo_price || product.price,
        };
        return [...prev, newItem];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const maxStock = item.product.available_stock ?? item.product.stock_quantity;
          return { ...item, quantity: Math.min(maxStock, newQty) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setShipping(null);
  };

  const applyCoupon = async (code: string) => {
    const res = await apiFetch<{ coupon: AppliedCoupon }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    });
    setCoupon(res.coupon);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        shipping,
        setShipping,
        subtotal,
        discount,
        total,
        itemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser utilizado dentro de CartProvider');
  return context;
};
