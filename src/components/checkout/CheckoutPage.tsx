import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Truck,
  CreditCard,
  QrCode,
  Copy,
  Lock,
  ArrowRight,
  Clock,
  AlertCircle,
  PackageCheck,
  Check,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { apiFetch } from '../../services/api.js';
import { Order } from '../../types/index.js';

interface CheckoutPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { items, subtotal, discount, total, clearCart, shipping, setShipping } = useCart();
  const { user, addresses } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info & Shipping, 2: Payment, 3: Confirmation

  // Identification Form
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerCpf, setCustomerCpf] = useState(user?.cpf || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Address Form
  const [cep, setCep] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  // Shipping Method
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Copy success feedback
  const [copiedPix, setCopiedPix] = useState(false);

  // Timer countdown for Pix
  const [pixTimeLeft, setPixTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setCep(def.cep);
      setState(def.state);
      setCity(def.city);
      setNeighborhood(def.neighborhood);
      setStreet(def.street);
      setNumber(def.number);
      setComplement(def.complement || '');
      fetchShipping(def.cep);
    }
  }, [addresses]);

  useEffect(() => {
    if (createdOrder && createdOrder.payment_method === 'PIX' && pixTimeLeft > 0) {
      const timer = setInterval(() => {
        setPixTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [createdOrder, pixTimeLeft]);

  // ViaCEP lookup
  const handleCepBlur = async () => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setState(data.uf);
          setCity(data.localidade);
          setNeighborhood(data.bairro);
          setStreet(data.logradouro);
          await fetchShipping(cleaned);
        }
      } catch (err) {
        console.error('ViaCEP lookup error:', err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const fetchShipping = async (targetCep: string) => {
    try {
      const res = await apiFetch<{ options: any[] }>('/api/shipping/calculate', {
        method: 'POST',
        body: JSON.stringify({ cep: targetCep, items_subtotal: subtotal }),
      });
      setShippingOptions(res.options);
      if (res.options.length > 0 && !shipping) {
        setShipping(res.options[0]);
      }
    } catch {}
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerCpf || !street || !number || !city || !state) {
      setError('Preencha todos os campos obrigatórios de identificação e endereço.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleProcessOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const checkoutData = {
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant?.id,
          quantity: i.quantity,
        })),
        shipping_address: {
          recipient_name: customerName,
          cep,
          state,
          city,
          neighborhood,
          street,
          number,
          complement,
        },
        shipping_method: shipping,
        payment_method: paymentMethod,
      };

      const res = await apiFetch<{ success: boolean; order: Order }>('/api/checkout/reserve', {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      });

      if (res.success && res.order) {
        setCreatedOrder(res.order);
        clearCart();
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar checkout.');
    } finally {
      setLoading(false);
    }
  };

  // Live Webhook Sandbox Simulator Trigger
  const handleSimulatePaymentApproval = async () => {
    if (!createdOrder) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; new_status: string }>('/api/webhooks/simulator', {
        method: 'POST',
        body: JSON.stringify({
          order_id: createdOrder.id,
          action: 'APPROVE',
        }),
      });

      if (res.success) {
        setCreatedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'Pago',
                payment_status: 'APPROVED',
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (createdOrder?.pix_copia_e_cola) {
      navigator.clipboard.writeText(createdOrder.pix_copia_e_cola);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-20 text-center space-y-4">
        <p className="text-sm font-semibold">Seu carrinho de compras está vazio.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-6 py-3 rounded-full"
        >
          Explorar Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Step Wizard Bar */}
        <div className="flex items-center justify-between max-w-xl mx-auto mb-10 text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            <span>Identificação</span>
          </div>
          <div className="w-12 h-0.5 bg-[#333]" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            <span>Pagamento</span>
          </div>
          <div className="w-12 h-0.5 bg-[#333]" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
            <span>Confirmação</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* STEP 1: IDENTIFICATION & ADDRESS */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Info */}
              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-4">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Dados Pessoais de Identificação
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[#8C8A96] block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Mariana Silva Soares"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">E-mail para Confirmação *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com.br"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">CPF (Necessário para Nota Fiscal) *</label>
                    <input
                      type="text"
                      required
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-4">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Endereço de Entrega
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[#8C8A96] block mb-1">CEP *</label>
                    <input
                      type="text"
                      required
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[#8C8A96] block mb-1">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Avenida Paulista"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Número *</label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 102"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#8C8A96] block mb-1">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Shipping Method Options */}
                {shippingOptions.length > 0 && (
                  <div className="pt-4 border-t border-[#25252A] space-y-2">
                    <p className="text-xs font-semibold text-[#FAF8F5]">Selecione a Modalidade de Frete:</p>
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.code}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer ${
                          shipping?.code === opt.code
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#FAF8F5]'
                            : 'border-[#2A2A30] text-[#8C8A96]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shipping?.code === opt.code}
                            onChange={() => setShipping(opt)}
                            className="accent-[#D4AF37]"
                          />
                          <div>
                            <p className="font-semibold">{opt.name}</p>
                            <p className="text-[10px] text-[#8C8A96]">Prazo estimado: {opt.delivery_days} dias úteis</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#D4AF37]">
                          {opt.price === 0 ? 'GRÁTIS' : `R$ ${opt.price.toFixed(2)}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Ir para o Pagamento <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary Column */}
            <CheckoutSummary items={items} subtotal={subtotal} discount={discount} shipping={shipping} total={total} />
          </form>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-6">
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Selecione o Método de Pagamento
                </h3>

                {/* Tab selector */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'PIX'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#FAF8F5]'
                        : 'border-[#2A2A30] text-[#8C8A96]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-[#25D366]" />
                      <div>
                        <p className="text-xs font-bold">PIX Dinâmico Instantâneo</p>
                        <p className="text-[10px] text-[#25D366] font-semibold">5% de Desconto Extra</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#FAF8F5]'
                        : 'border-[#2A2A30] text-[#8C8A96]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs font-bold">Cartão de Crédito</p>
                        <p className="text-[10px] text-[#8C8A96]">Até 10x sem juros</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* PIX Explanation */}
                {paymentMethod === 'PIX' && (
                  <div className="p-4 bg-[#1A281E] border border-[#2D5A34] rounded-xl text-xs space-y-2">
                    <p className="font-bold text-[#25D366] flex items-center gap-1.5">
                      ⚡ Aprovação Imediata & Reserva Prioritária de Estoque
                    </p>
                    <p className="text-[#D0C0B0] leading-relaxed">
                      Ao clicar em finalizar, será gerado o QR Code e o código Copia e Cola para pagamento no seu aplicativo do banco.
                    </p>
                  </div>
                )}

                {/* Credit Card Form */}
                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="space-y-4 pt-4 border-t border-[#25252A] text-xs">
                    <div>
                      <label className="text-[#8C8A96] block mb-1">Número do Cartão *</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[#8C8A96] block mb-1">Nome Impresso no Cartão *</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Como está no cartão"
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[#8C8A96] block mb-1">Validade (MM/AA) *</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[#8C8A96] block mb-1">CVV *</label>
                        <input
                          type="text"
                          required
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#8C8A96] block mb-1">Opções de Parcelamento sem Juros *</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40]"
                      >
                        {[...Array(10)].map((_, i) => {
                          const num = i + 1;
                          const val = total / num;
                          return (
                            <option key={num} value={num}>
                              {num}x de R$ {val.toFixed(2)} sem juros
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-[#1A1A1E] hover:bg-[#25252A] text-[#FAF8F5] font-bold text-xs px-6 py-4 rounded-xl border border-[#3A3A40]"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleProcessOrder}
                  disabled={loading}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Reservando Estoque & Gerando Cobrança...' : 'CONCLUIR PEDIDO & PAGAR'}
                </button>
              </div>
            </div>

            <CheckoutSummary items={items} subtotal={subtotal} discount={discount} shipping={shipping} total={total} />
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMATION & REAL PIX GATEWAY */}
        {step === 3 && createdOrder && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-[#141416] p-8 rounded-2xl border border-[#2D5A34] text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-[#25D366]/20 text-[#25D366] rounded-full flex items-center justify-center mx-auto border border-[#25D366]/40">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                  Pedido Realizado com Sucesso
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5] mt-1">
                  Pedido #{createdOrder.order_number}
                </h2>
                <p className="text-xs text-[#8C8A96] mt-1">
                  Enviamos o comprovante e os detalhes para o e-mail: <strong className="text-[#FAF8F5]">{createdOrder.user_email}</strong>
                </p>
              </div>

              {/* Status Tracker */}
              <div className="p-4 bg-[#1A1A1E] rounded-xl border border-[#25252A] text-xs flex items-center justify-between">
                <span className="text-[#8C8A96]">Status Atual do Pedido:</span>
                <span className={`font-bold px-3 py-1 rounded-full uppercase text-[10px] ${
                  createdOrder.status === 'Pago'
                    ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                    : 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                }`}>
                  {createdOrder.status}
                </span>
              </div>

              {/* PIX QR CODE PAYMENT SECTION */}
              {createdOrder.payment_method === 'PIX' && createdOrder.status === 'Aguardando pagamento' && (
                <div className="p-6 bg-[#18181A] rounded-2xl border border-[#D4AF37]/40 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#D4AF37]">
                    <Clock className="w-4 h-4" />
                    <span>Aguardando Pagamento Pix (Expira em {formatTimer(pixTimeLeft)})</span>
                  </div>

                  {/* QR Code Canvas/Image */}
                  {createdOrder.pix_qr_code && (
                    <div className="bg-white p-4 rounded-xl w-48 h-48 mx-auto shadow-xl">
                      <img src={createdOrder.pix_qr_code} alt="QR Code PIX" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-[#8C8A96]">Código Pix Copia e Cola:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdOrder.pix_copia_e_cola}
                        className="w-full bg-[#101012] text-xs text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] font-mono truncate"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs p-3 rounded-xl hover:bg-[#c5a028] flex-shrink-0 flex items-center gap-1"
                      >
                        {copiedPix ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* SIMULATE PAYMENT WEBHOOK Live Test Button */}
                  <div className="pt-4 border-t border-[#2A2A30]">
                    <p className="text-[10px] text-[#A0A0AA] mb-2">
                      💡 <strong>Ambiente Sandbox / Produção:</strong> Clique no botão abaixo para simular a notificação em tempo real do webhook de pagamento aprovado pelo gateway!
                    </p>
                    <button
                      onClick={handleSimulatePaymentApproval}
                      disabled={loading}
                      className="bg-[#25D366] hover:bg-[#20bd5a] text-[#0F0F10] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg transition-all"
                    >
                      {loading ? 'Aprovando...' : '⚡ SIMULAR APROVAÇÃO DO PIX (WEBHOOK)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Order Items & Shipping Summary */}
              <div className="text-left space-y-3 pt-4 border-t border-[#222226] text-xs text-[#8C8A96]">
                <p className="font-semibold text-[#FAF8F5]">Endereço de Entrega:</p>
                <p>
                  {createdOrder.shipping_address.street}, {createdOrder.shipping_address.number} {createdOrder.shipping_address.complement} - {createdOrder.shipping_address.neighborhood}, {createdOrder.shipping_address.city}/{createdOrder.shipping_address.state} (CEP: {createdOrder.shipping_address.cep})
                </p>

                <div className="pt-2 flex justify-between font-bold text-sm text-[#FAF8F5]">
                  <span>Total do Pedido:</span>
                  <span className="text-[#D4AF37]">R$ {createdOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('account', 'orders')}
                className="w-full bg-[#1A1A1E] hover:bg-[#25252A] text-[#FAF8F5] border border-[#3A3A40] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl"
              >
                Acompanhar Meus Pedidos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Summary Component */
const CheckoutSummary: React.FC<{
  items: any[];
  subtotal: number;
  discount: number;
  shipping: any;
  total: number;
}> = ({ items, subtotal, discount, shipping, total }) => {
  return (
    <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-4 h-fit">
      <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] pb-3 border-b border-[#25252A]">
        Resumo do Pedido ({items.length} itens)
      </h3>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-xs">
            <img src={item.product.images[0]?.image_url} alt="" className="w-12 h-12 object-cover rounded-lg bg-[#222]" />
            <div className="flex-1">
              <p className="font-semibold text-[#FAF8F5] line-clamp-1">{item.product.name}</p>
              <p className="text-[10px] text-[#8C8A96]">{item.quantity}x R$ {item.unit_price.toFixed(2)}</p>
            </div>
            <span className="font-bold text-[#D4AF37]">R$ {(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-[#25252A] space-y-2 text-xs">
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
          <span>Total Final</span>
          <span className="text-[#D4AF37]">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
