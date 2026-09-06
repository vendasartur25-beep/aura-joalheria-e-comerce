import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  Award,
  RefreshCw,
  MessageCircle,
  Mail,
  Lock,
  Instagram,
  CheckCircle,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const whatsappNumber = '5511999999999';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de atendimento exclusivo sobre os produtos da Aura Joias.')}`;

  return (
    <footer className="bg-[#0A0A0B] text-[#D0C0B0] border-t border-[#222226] pt-16 pb-12 font-sans">
      {/* Value Proposition Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-[#1E1E24]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="flex items-start gap-4 justify-center sm:justify-start">
            <div className="p-3 bg-[#1A1A1E] text-[#D4AF37] rounded-xl border border-[#33333A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">Garantia Vitalícia</h4>
              <p className="text-xs text-[#8C8A96] mt-1 leading-relaxed">
                Certificado de autenticidade permanente do Ouro 18k e Prata 925.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 justify-center sm:justify-start">
            <div className="p-3 bg-[#1A1A1E] text-[#D4AF37] rounded-xl border border-[#33333A]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">Envio Seguro com Seguro</h4>
              <p className="text-xs text-[#8C8A96] mt-1 leading-relaxed">
                Frete grátis em compras acima de R$ 500 com rastreamento blindado.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 justify-center sm:justify-start">
            <div className="p-3 bg-[#1A1A1E] text-[#D4AF37] rounded-xl border border-[#33333A]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">Troca Grátis em 30 Dias</h4>
              <p className="text-xs text-[#8C8A96] mt-1 leading-relaxed">
                Primeira troca sem custo para garantir seu ajuste e satisfação total.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 justify-center sm:justify-start">
            <div className="p-3 bg-[#1A1A1E] text-[#D4AF37] rounded-xl border border-[#33333A]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FAF8F5] tracking-wide">Design Exclusivo Aura</h4>
              <p className="text-xs text-[#8C8A96] mt-1 leading-relaxed">
                Designers de joias artesanais lapidadas com precisão cirúrgica.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Col 1: Brand & Bio */}
        <div className="lg:col-span-2 space-y-4">
          <div className="select-none">
            <span className="text-3xl font-serif font-semibold tracking-[0.25em] text-[#FAF8F5]">AURA</span>
            <span className="block text-[10px] tracking-[0.4em] uppercase text-[#D4AF37] -mt-1 font-medium">
              Alta Joalheria
            </span>
          </div>
          <p className="text-xs text-[#8C8A96] leading-relaxed max-w-sm">
            E-commerce de alta joalheria contemporânea focado em elegância, autenticidade e peças eternas em ouro 18k e prata de lei.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-lg"
            >
              <MessageCircle className="w-4 h-4" /> Concierge WhatsApp
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-[#1A1A1E] text-[#FAF8F5] hover:text-[#D4AF37] rounded-full border border-[#33333A] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Col 2: Institutional */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF8F5]">Institucional</h5>
          <ul className="space-y-2 text-xs text-[#8C8A96]">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-[#D4AF37] transition-colors">
                Sobre a Aura
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog')} className="hover:text-[#D4AF37] transition-colors">
                Catálogo de Joias
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('catalog', 'promocao=true')} className="hover:text-[#D4AF37] transition-colors">
                Coleção de Ofertas
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('account')} className="hover:text-[#D4AF37] transition-colors">
                Área do Cliente
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Customer Care */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF8F5]">Atendimento & Ajuda</h5>
          <ul className="space-y-2 text-xs text-[#8C8A96]">
            <li>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">
                Fale com Atendente
              </a>
            </li>
            <li>
              <span className="hover:text-[#D4AF37] cursor-pointer">Política de Trocas e Devoluções</span>
            </li>
            <li>
              <span className="hover:text-[#D4AF37] cursor-pointer">Política de Privacidade (LGPD)</span>
            </li>
            <li>
              <span className="hover:text-[#D4AF37] cursor-pointer">Termos de Uso</span>
            </li>
            <li>
              <span className="hover:text-[#D4AF37] cursor-pointer">Cuidados com sua Joia</span>
            </li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF8F5]">Privilégios Aura</h5>
          <p className="text-xs text-[#8C8A96]">
            Inscreva-se para receber convites para lançamentos de coleções e ofertas reservadas.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                className="w-full bg-[#1A1A1E] text-[#FAF8F5] text-xs pl-3 pr-10 py-2.5 rounded-lg border border-[#33333A] focus:border-[#D4AF37] focus:outline-none placeholder-[#666670]"
              />
              <button type="submit" className="absolute right-2 top-2 text-[#D4AF37] hover:text-white p-1">
                <Mail className="w-4 h-4" />
              </button>
            </div>
            {subscribed && (
              <p className="text-[11px] text-[#25D366] flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Cadastro efetuado com sucesso!
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Legal & Payment Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#1E1E24] flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#666672]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Aura Joias Brasil LTDA • CNPJ 00.000.000/0001-00 • Ambiente Seguro SSL</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-[11px] uppercase tracking-wider text-[#8C8A96]">Pagamento Seguro:</span>
          <span className="bg-[#1A1A1E] px-2.5 py-1 rounded text-[10px] text-[#D4AF37] font-bold border border-[#33333A]">
            PIX DINÂMICO
          </span>
          <span className="bg-[#1A1A1E] px-2.5 py-1 rounded text-[10px] text-[#FAF8F5] border border-[#33333A]">
            CARTÃO DE CRÉDITO
          </span>
          <span className="bg-[#1A1A1E] px-2.5 py-1 rounded text-[10px] text-[#FAF8F5] border border-[#33333A]">
            MERCADO PAGO
          </span>
        </div>
      </div>
    </footer>
  );
};
