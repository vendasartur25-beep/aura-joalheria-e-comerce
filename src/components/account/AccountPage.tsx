import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Truck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useFavorites } from '../../context/FavoritesContext.js';
import { Order, Product } from '../../types/index.js';
import { apiFetch } from '../../services/api.js';
import { ProductCard } from '../home/HomePage.js';
import { useCart } from '../../context/CartContext.js';

interface AccountPageProps {
  onNavigate: (view: string, param?: string) => void;
  defaultTab?: string;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, defaultTab = 'orders' }) => {
  const { user, addresses, addAddress, deleteAddress, logout } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'favorites' | 'profile'>(
    (defaultTab as any) || 'orders'
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Address form modal state
  const [newAddrModal, setNewAddrModal] = useState(false);
  const [addrCep, setAddrCep] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [addrComp, setAddrComp] = useState('');
  const [addrNeigh, setAddrNeigh] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');

  useEffect(() => {
    if (user) {
      loadCustomerOrders();
    }
  }, [user]);

  useEffect(() => {
    if (favorites.length > 0) {
      loadFavoriteProducts();
    } else {
      setFavoriteProducts([]);
    }
  }, [favorites]);

  const loadCustomerOrders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ orders: Order[] }>('/api/orders/my');
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteProducts = async () => {
    try {
      const res = await apiFetch<{ products: Product[] }>('/api/products?limit=100');
      const filtered = (res.products || []).filter((p) => favorites.includes(p.id));
      setFavoriteProducts(filtered);
    } catch {}
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAddress({
        cep: addrCep,
        street: addrStreet,
        number: addrNumber,
        complement: addrComp,
        neighborhood: addrNeigh,
        city: addrCity,
        state: addrState,
        is_default: addresses.length === 0,
      });
      setNewAddrModal(false);
      setAddrCep('');
      setAddrStreet('');
      setAddrNumber('');
      setAddrComp('');
      setAddrNeigh('');
      setAddrCity('');
      setAddrState('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-20 text-center space-y-4">
        <p className="text-sm font-semibold">Faça login para acessar sua Área de Cliente.</p>
        <button
          onClick={() => onNavigate('auth')}
          className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-8 py-3 rounded-full"
        >
          Entrar na Minha Conta
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header User Banner */}
        <div className="bg-[#141416] p-6 sm:p-8 rounded-2xl border border-[#25252A] mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center font-serif font-bold text-2xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-[#FAF8F5]">{user.name}</h1>
              <p className="text-xs text-[#8C8A96]">{user.email} • CPF: {user.cpf || 'Não informado'}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="text-xs text-red-400 hover:underline font-semibold"
          >
            Sair da Conta
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#25252A] pb-4 mb-8 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Meus Pedidos ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'addresses' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" /> Endereços ({addresses.length})
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'favorites' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" /> Minha Lista de Desejos ({favorites.length})
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-[#141416] p-12 rounded-2xl border border-[#25252A] text-center space-y-3">
                <Package className="w-10 h-10 text-[#D4AF37] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[#FAF8F5]">Você ainda não realizou nenhum pedido.</p>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-6 py-2.5 rounded-full"
                >
                  Ir às Compras
                </button>
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#25252A] text-xs">
                    <div>
                      <span className="font-bold text-[#D4AF37] text-sm">{ord.order_number}</span>
                      <span className="text-[#8C8A96] block text-[10px]">Data: {new Date(ord.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        ord.status === 'Pago' || ord.status === 'Entregue'
                          ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                          : 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                      }`}>
                        {ord.status}
                      </span>
                      <span className="font-bold text-[#FAF8F5]">R$ {ord.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3">
                    {ord.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-xs">
                        <img src={item.product_image} alt="" className="w-12 h-12 object-cover rounded-lg bg-[#222]" />
                        <div className="flex-1">
                          <p className="font-semibold text-[#FAF8F5]">{item.product_name}</p>
                          <p className="text-[10px] text-[#8C8A96]">{item.quantity}x • SKU: {item.product_sku}</p>
                        </div>
                        <span className="font-bold text-[#D4AF37]">R$ {item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking & Pix retry */}
                  <div className="pt-3 border-t border-[#222226] flex flex-wrap items-center justify-between gap-4 text-xs">
                    {ord.tracking_code && (
                      <a
                        href={ord.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D4AF37] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Truck className="w-4 h-4" /> Rastreio Correios: {ord.tracking_code} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {ord.status === 'Aguardando pagamento' && ord.payment_method === 'PIX' && (
                      <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Aguardando compensação do Pix
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#FAF8F5]">Meus Endereços Cadastrados</h3>
              <button
                onClick={() => setNewAddrModal(true)}
                className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Novo Endereço
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-[#141416] p-5 rounded-2xl border border-[#25252A] space-y-2 text-xs relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D4AF37]">{addr.recipient_name}</span>
                    {addr.is_default && (
                      <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded uppercase font-bold">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-[#FAF8F5]">
                    {addr.street}, {addr.number} {addr.complement}
                  </p>
                  <p className="text-[#8C8A96]">
                    {addr.neighborhood} - {addr.city}/{addr.state} • CEP: {addr.cep}
                  </p>
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-red-400 hover:text-red-300 pt-2 block font-medium"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Add Address */}
            {newAddrModal && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141416] p-6 rounded-2xl border border-[#3A3A40] w-full max-w-md space-y-4">
                  <h3 className="text-sm font-bold text-[#D4AF37]">Cadastrar Endereço</h3>
                  <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                    <input
                      type="text"
                      placeholder="CEP"
                      required
                      value={addrCep}
                      onChange={(e) => setAddrCep(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />
                    <input
                      type="text"
                      placeholder="Rua"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Número"
                        required
                        value={addrNumber}
                        onChange={(e) => setAddrNumber(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                      <input
                        type="text"
                        placeholder="Complemento"
                        value={addrComp}
                        onChange={(e) => setAddrComp(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      required
                      value={addrNeigh}
                      onChange={(e) => setAddrNeigh(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Cidade"
                        required
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                      <input
                        type="text"
                        placeholder="UF"
                        required
                        maxLength={2}
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value.toUpperCase())}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewAddrModal(false)}
                        className="w-full bg-[#2A2A30] text-white p-2.5 rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="w-full bg-[#D4AF37] text-[#0F0F10] font-bold p-2.5 rounded-xl">
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteProducts.length === 0 ? (
              <div className="bg-[#141416] p-12 rounded-2xl border border-[#25252A] text-center space-y-3">
                <Heart className="w-10 h-10 text-[#D4AF37] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[#FAF8F5]">Sua lista de desejos está vazia.</p>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs uppercase px-6 py-2.5 rounded-full"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteProducts.map((prod) => (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
