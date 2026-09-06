import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Percent,
  Tag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { apiFetch } from '../../services/api.js';

interface CartDrawerProps {
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onContinueShopping }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discount,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
    shipping,
    setShipping,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [cepInput, setCepInput] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Erro ao aplicar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepInput.trim()) return;
    setShippingLoading(true);
    try {
      const res = await apiFetch<{ options: any[] }>('/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ cep: cepInput, items_subtotal: subtotal }),
      });
      setShippingOptions(res.options);
      if (res.options.length > 0) {
        setShipping(res.options[0]); // Default select PAC
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setShippingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0F0F10] text-[#FAF8F5] border-l border-[#2D2D35] flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#2A2A30] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-base font-serif font-semibold tracking-wider text-[#FAF8F5]">
                Meu Carrinho de Compras
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#8C8A96] hover:text-[#FAF8F5] transition-colors rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#1A1A1E] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto border border-[#3A3A42]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-[#FAF8F5]">Seu carrinho está vazio</p>
                <p className="text-xs text-[#8C8A96] max-w-xs mx-auto leading-relaxed">
                  Explore nossas coleções exclusivas de joias e adicione peças ao seu carrinho.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onContinueShopping();
                  }}
                  className="mt-4 bg-[#D4AF37] text-[#0F0F10] font-semibold text-xs tracking-wider px-6 py-3 rounded-full uppercase hover:bg-[#c5a028] transition-all"
                >
                  Explorar Joias
                </button>
              </div>
            ) : (
              items.map((item) => {
                const maxStock = item.product.available_stock ?? item.product.stock_quantity;
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-3 bg-[#161618] border border-[#2A2A30] rounded-xl hover:border-[#3A3A45] transition-colors"
                  >
                    <img
                      src={item.product.images[0]?.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg bg-[#252528] flex-shrink-0"
                    />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-medium text-[#FAF8F5] line-clamp-2">{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#8C8A96] hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#8C8A96] mt-0.5">SKU: {item.product.sku}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#222226]">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-[#202024] border border-[#33333A] rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-[#8C8A96] hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= maxStock}
                            className="p-1 text-[#8C8A96] hover:text-white disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#D4AF37]">
                            R$ {(item.unit_price * item.quantity).toFixed(2)}
                          </p>
                          {maxStock <= 3 && (
                            <p className="text-[9px] text-amber-400 font-semibold mt-0.5">
                              Apenas {maxStock} em estoque!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Coupons Section */}
            {items.length > 0 && (
              <div className="pt-4 border-t border-[#2A2A30] space-y-3">
                <p className="text-xs font-semibold text-[#FAF8F5] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37]" /> Cupom de Desconto
                </p>

                {coupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-[#1A281E] border border-[#2D5A34] rounded-lg text-xs">
                    <span className="font-bold text-[#25D366] flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" /> {coupon.code} (-R$ {coupon.discount_amount.toFixed(2)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-400 hover:underline font-medium"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Ex: AURA10"
                      className="flex-1 bg-[#1A1A1E] text-xs text-[#FAF8F5] px-3 py-2 rounded-lg border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none uppercase"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-[#2A2A30] hover:bg-[#3A3A40] text-[#FAF8F5] text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
              </div>
            )}

            {/* Shipping Calculator */}
            {items.length > 0 && (
              <div className="pt-3 border-t border-[#2A2A30] space-y-2">
                <p className="text-xs font-semibold text-[#FAF8F5] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#D4AF37]" /> Calcular Frete
                </p>
                <form onSubmit={handleCalculateShipping} className="flex gap-2">
                  <input
                    type="text"
                    value={cepInput}
                    onChange={(e) => setCepInput(e.target.value)}
                    placeholder="CEP: 00000-000"
                    maxLength={9}
                    className="flex-1 bg-[#1A1A1E] text-xs text-[#FAF8F5] px-3 py-2 rounded-lg border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={shippingLoading}
                    className="bg-[#2A2A30] hover:bg-[#3A3A40] text-[#FAF8F5] text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {shippingLoading ? '...' : 'Calcular'}
                  </button>
                </form>

                {shippingOptions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.code}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                          shipping?.code === opt.code
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#FAF8F5]'
                            : 'border-[#2A2A30] text-[#8C8A96]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="cart_shipping"
                            checked={shipping?.code === opt.code}
                            onChange={() => setShipping(opt)}
                            className="accent-[#D4AF37]"
                          />
                          <span>{opt.name} ({opt.delivery_days} dias)</span>
                        </div>
                        <span className="font-bold text-[#D4AF37]">
                          {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2)}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer Summary & Checkout Button */}
          {items.length > 0 && (
            <div className="p-6 bg-[#141416] border-t border-[#2A2A30] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#8C8A96]">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#25D366] font-medium">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#8C8A96]">
                  <span>Frete</span>
                  <span>{shipping ? (shipping.price === 0 ? 'GRÁTIS' : `R$ ${shipping.price.toFixed(2)}`) : 'A calcular'}</span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#FAF8F5] pt-2 border-t border-[#222226]">
                  <span>Total</span>
                  <span className="text-[#D4AF37]">R$ {total.toFixed(2)}</span>
                </div>

                <p className="text-[10px] text-[#25D366] font-semibold text-right pt-1">
                  ⚡ R$ {(total * 0.95).toFixed(2)} à vista no PIX (5% OFF Adicional)
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="w-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                FINALIZAR COMPRA <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] text-center text-[#7A7A85] flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Checkout 100% Criptografado & Seguro
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
