import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit,
  Truck,
  ShieldCheck,
  Activity,
  QrCode,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { apiFetch } from '../../services/api.js';
import { Order, Product, AuditLog } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'products' | 'orders' | 'webhooks' | 'audit'>('metrics');

  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal
  const [newProdModal, setNewProdModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodPromoPrice, setProdPromoPrice] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodCat, setProdCat] = useState('cat_001');
  const [prodMat, setProdMat] = useState('Ouro 18k');
  const [prodImg, setProdImg] = useState('');

  // Stock Adjust Modal
  const [adjustModal, setAdjustModal] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('5');
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('Ajuste de inventário físico');

  // Webhook Simulator
  const [simOrderId, setSimOrderId] = useState('');
  const [simAction, setSimAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [simMessage, setSimMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'metrics') {
        const res = await apiFetch<{ metrics: any }>('/api/admin/metrics');
        setMetrics(res.metrics);
      } else if (activeTab === 'products') {
        const res = await apiFetch<{ products: Product[] }>('/api/admin/products');
        setProducts(res.products || []);
      } else if (activeTab === 'orders') {
        const res = await apiFetch<{ orders: Order[] }>('/api/admin/orders');
        setOrders(res.orders || []);
      } else if (activeTab === 'audit') {
        const res = await apiFetch<{ audit_logs: AuditLog[] }>('/api/admin/audit-logs');
        setAuditLogs(res.audit_logs || []);
      }
    } catch (err: any) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: prodName,
          price: Number(prodPrice),
          promo_price: prodPromoPrice ? Number(prodPromoPrice) : undefined,
          sku: prodSku,
          stock_quantity: Number(prodStock),
          category_id: prodCat,
          material: prodMat,
          image_url: prodImg || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
        }),
      });

      setNewProdModal(false);
      setProdName('');
      setProdPrice('');
      setProdPromoPrice('');
      setProdSku('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;
    try {
      await apiFetch(`/api/admin/products/${adjustModal.id}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: Number(adjustQty),
          type: adjustType,
          reason: adjustReason,
        }),
      });
      setAdjustModal(null);
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, trackingCode?: string) => {
    try {
      await apiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, tracking_code: trackingCode }),
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunWebhookSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simOrderId) return;
    try {
      const res = await apiFetch<{ success: boolean; order_number: string; new_status: string }>(
        '/api/webhooks/simulator',
        {
          method: 'POST',
          body: JSON.stringify({
            order_id: simOrderId,
            action: simAction,
          }),
        }
      );

      setSimMessage(`⚡ Webhook processado! Pedido #${res.order_number} atualizado para "${res.new_status}".`);
    } catch (err: any) {
      setSimMessage(`❌ Erro: ${err.message}`);
    }
  };

  if (!user || user.role === 'CUSTOMER') {
    return (
      <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-20 text-center space-y-4">
        <p className="text-sm font-semibold text-red-400">Acesso negado. Permissão administrativa necessária.</p>
        <button onClick={() => onNavigate('home')} className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs px-6 py-2.5 rounded-full">
          Voltar para a Loja
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F10] text-[#FAF8F5] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#25252A]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              Painel de Gestão e Controle RBAC
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#FAF8F5]">
              Administração Aura Joias
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-3 py-1 rounded-lg uppercase">
              Operador: {user.name} ({user.role})
            </span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#25252A] pb-4 mb-8 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'metrics' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Visão Geral & Métricas
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'products' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Gestão de Produtos & Estoque
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Pedidos Realizados
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'webhooks' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" /> Testador de Webhooks Pix
          </button>

          {user.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'audit' ? 'bg-[#D4AF37] text-[#0F0F10]' : 'bg-[#141416] text-[#8C8A96] hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> Audit Logs
            </button>
          )}
        </div>

        {/* TAB 1: METRICS */}
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-2">
                <div className="flex items-center justify-between text-[#25D366]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8A96]">Faturamento Real</span>
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-[#FAF8F5]">
                  R$ {metrics.total_revenue.toFixed(2)}
                </p>
                <p className="text-[10px] text-[#25D366] font-semibold">Calculado de pedidos confirmados</p>
              </div>

              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-2">
                <div className="flex items-center justify-between text-[#D4AF37]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8A96]">Pedidos Concluídos</span>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-[#FAF8F5]">
                  {metrics.paid_orders_count} / {metrics.total_orders_count}
                </p>
                <p className="text-[10px] text-[#8C8A96]">Total de pedidos recebidos</p>
              </div>

              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-2">
                <div className="flex items-center justify-between text-[#D4AF37]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8A96]">Produtos em Linha</span>
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-[#FAF8F5]">{metrics.total_products_count}</p>
                <p className="text-[10px] text-[#8C8A96]">Catálogo ativo de alta joalheria</p>
              </div>

              <div className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-2">
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8C8A96]">Alerta de Estoque Zero</span>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{metrics.out_of_stock_count}</p>
                <p className="text-[10px] text-amber-400 font-semibold">Itens esgotados que precisam reposição</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#FAF8F5]">Catálogo de Produtos & Controle de Estoque</h3>
              <button
                onClick={() => setNewProdModal(true)}
                className="bg-[#D4AF37] text-[#0F0F10] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Produto
              </button>
            </div>

            <div className="bg-[#141416] border border-[#25252A] rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs text-[#8C8A96]">
                <thead className="bg-[#1A1A1E] text-[#D4AF37] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Preço Regular</th>
                    <th className="p-4">Preço Pix</th>
                    <th className="p-4">Estoque Atual</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#1A1A1E]">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.images[0]?.image_url} alt="" className="w-10 h-10 object-cover rounded-lg bg-[#222]" />
                        <div>
                          <p className="font-semibold text-[#FAF8F5]">{p.name}</p>
                          <p className="text-[10px] text-[#7A7A85]">{p.material}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[#FAF8F5]">{p.sku}</td>
                      <td className="p-4 font-bold text-[#FAF8F5]">R$ {p.price.toFixed(2)}</td>
                      <td className="p-4 font-bold text-[#25D366]">R$ {p.pix_price.toFixed(2)}</td>
                      <td className="p-4 font-bold text-[#D4AF37]">{p.stock_quantity} un</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setAdjustModal(p)}
                          className="bg-[#2A2A30] text-[#FAF8F5] hover:bg-[#D4AF37] hover:text-[#0F0F10] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                        >
                          Ajustar Estoque
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Create Product */}
            {newProdModal && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141416] p-6 rounded-2xl border border-[#3A3A40] w-full max-w-lg space-y-4">
                  <h3 className="text-sm font-bold text-[#D4AF37]">Cadastrar Nova Joia</h3>
                  <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                    <input
                      type="text"
                      placeholder="Nome da Joia"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Preço (R$)"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        required
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Quantidade em Estoque"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                      <input
                        type="text"
                        placeholder="Material (Ex: Ouro 18k)"
                        value={prodMat}
                        onChange={(e) => setProdMat(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                    </div>
                    <input
                      type="url"
                      placeholder="URL da Imagem do Produto"
                      value={prodImg}
                      onChange={(e) => setProdImg(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewProdModal(false)}
                        className="w-full bg-[#2A2A30] text-white p-2.5 rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="w-full bg-[#D4AF37] text-[#0F0F10] font-bold p-2.5 rounded-xl">
                        Cadastrar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Stock Adjuster */}
            {adjustModal && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-[#141416] p-6 rounded-2xl border border-[#3A3A40] w-full max-w-md space-y-4">
                  <h3 className="text-sm font-bold text-[#D4AF37]">Ajuste Manual de Estoque</h3>
                  <p className="text-xs text-[#8C8A96]">{adjustModal.name} (SKU: {adjustModal.sku})</p>
                  <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={adjustType}
                        onChange={(e) => setAdjustType(e.target.value as any)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      >
                        <option value="IN">Entrada (+)</option>
                        <option value="OUT">Saída / Ajuste (-)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Motivo da movimentação"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                    />

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAdjustModal(null)}
                        className="w-full bg-[#2A2A30] text-white p-2.5 rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="w-full bg-[#D4AF37] text-[#0F0F10] font-bold p-2.5 rounded-xl">
                        Confirmar Movimentação
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-[#FAF8F5]">Gestão de Pedidos & Logística</h3>

            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-[#141416] p-6 rounded-2xl border border-[#25252A] space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#25252A]">
                    <div>
                      <span className="font-bold text-[#D4AF37] text-sm">{ord.order_number}</span>
                      <p className="text-[#8C8A96] text-[10px]">
                        Cliente: {ord.user_name} ({ord.user_email})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#FAF8F5]">R$ {ord.total.toFixed(2)}</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="bg-[#1A1A1E] text-xs text-[#D4AF37] font-bold p-2 rounded-xl border border-[#3A3A40]"
                      >
                        <option value="Aguardando pagamento">Aguardando pagamento</option>
                        <option value="Pago">Pago</option>
                        <option value="Em preparação">Em preparação</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregue">Entregue</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Attachment Tracking Code */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#8C8A96]">Código de Rastreio Correios:</span>
                    <input
                      type="text"
                      defaultValue={ord.tracking_code || ''}
                      onBlur={(e) => handleUpdateOrderStatus(ord.id, ord.status, e.target.value)}
                      placeholder="Ex: BR987654321SP"
                      className="bg-[#1A1A1E] text-xs text-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#3A3A40]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WEBHOOK SIMULATOR */}
        {activeTab === 'webhooks' && (
          <div className="bg-[#141416] p-8 rounded-2xl border border-[#25252A] space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#25D366]" /> Testador de Webhook de Pagamento Pix
              </h3>
              <p className="text-xs text-[#8C8A96] mt-1 leading-relaxed">
                Ferramenta interativa de sandbox para simular notificações HTTP recebidas do gateway de pagamento (Mercado Pago / Pagar.me). O endpoint valida a chave de idempotência e atualiza automaticamente o pedido para status "PAGO" e realiza a baixa do estoque.
              </p>
            </div>

            {simMessage && (
              <p className="p-3 bg-[#1A281E] border border-[#2D5A34] text-[#25D366] text-xs font-bold rounded-xl">
                {simMessage}
              </p>
            )}

            <form onSubmit={handleRunWebhookSimulator} className="space-y-4 text-xs">
              <div>
                <label className="text-[#8C8A96] block mb-1">ID do Pedido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ord_... ou AUR-2026-8801"
                  value={simOrderId}
                  onChange={(e) => setSimOrderId(e.target.value)}
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40]"
                />
              </div>

              <div>
                <label className="text-[#8C8A96] block mb-1">Ação do Gateway *</label>
                <select
                  value={simAction}
                  onChange={(e) => setSimAction(e.target.value as any)}
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40]"
                >
                  <option value="APPROVE">APPROVE (Aprovar Pagamento Pix)</option>
                  <option value="REJECT">REJECT (Recusar / Expirar Cobrança)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-[#0F0F10] font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg"
              >
                Disparar Webhook Simulado
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#FAF8F5]">Registros de Auditoria do Sistema</h3>
            <div className="bg-[#141416] border border-[#25252A] rounded-2xl p-4 text-xs font-mono space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-[#1A1A1E] rounded-lg border border-[#222226] flex justify-between">
                  <div>
                    <span className="text-[#D4AF37] font-bold">{log.action}</span>
                    <span className="text-[#8C8A96] ml-2">por {log.user_email}</span>
                  </div>
                  <span className="text-[10px] text-[#7A7A85]">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
