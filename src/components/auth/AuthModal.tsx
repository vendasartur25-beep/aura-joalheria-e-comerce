import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        cpf: regCpf,
        phone: regPhone,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setEmail('admin@aurajoias.com.br');
    setPassword('admin123');
  };

  const fillCustomer = () => {
    setEmail('mariana@exemplo.com.br');
    setPassword('cliente123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-[#141416] text-[#FAF8F5] border border-[#2D2D35] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#25252A] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm font-serif font-bold tracking-wider">
              {mode === 'LOGIN' ? 'Acessar Minha Conta' : 'Criar Nova Conta Aura'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#8C8A96] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Demo Fast Fill Buttons for Testing */}
        {mode === 'LOGIN' && (
          <div className="p-3 bg-[#1A1A1E] border border-[#25252A] rounded-xl space-y-2 text-[11px]">
            <p className="text-[#D4AF37] font-semibold">⚡ Credenciais Rápidas de Teste:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fillAdmin}
                className="flex-1 bg-[#2A2A30] hover:bg-[#3A3A40] text-white py-1.5 px-2 rounded-lg font-mono text-[10px] truncate"
              >
                Atuar como Administrador
              </button>
              <button
                type="button"
                onClick={fillCustomer}
                className="flex-1 bg-[#2A2A30] hover:bg-[#3A3A40] text-white py-1.5 px-2 rounded-lg font-mono text-[10px] truncate"
              >
                Atuar como Cliente
              </button>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-[#8C8A96] block mb-1">E-mail *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com.br"
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] pl-10 pr-3 py-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                />
                <Mail className="w-4 h-4 text-[#8C8A96] absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-[#8C8A96] block mb-1">Senha *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] pl-10 pr-3 py-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-[#8C8A96] absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Autenticando...' : 'ENTRAR'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="text-[#8C8A96] block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ex: Mariana Silva"
                className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#8C8A96] block mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
                className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[#8C8A96] block mb-1">CPF *</label>
                <input
                  type="text"
                  required
                  value={regCpf}
                  onChange={(e) => setRegCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                />
              </div>
              <div>
                <label className="text-[#8C8A96] block mb-1">Telefone *</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-2.5 rounded-xl border border-[#3A3A40]"
                />
              </div>
            </div>

            <div>
              <label className="text-[#8C8A96] block mb-1">Senha *</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#1A1A1E] text-[#FAF8F5] p-3 rounded-xl border border-[#3A3A40]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-xl"
            >
              {loading ? 'Cadastrando...' : 'CRIAR MINHA CONTA'}
            </button>
          </form>
        )}

        {/* Toggle Mode Footer */}
        <div className="pt-2 text-center text-xs text-[#8C8A96]">
          {mode === 'LOGIN' ? (
            <p>
              Ainda não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="text-[#D4AF37] font-bold hover:underline"
              >
                Cadastre-se aqui
              </button>
            </p>
          ) : (
            <p>
              Já possui cadastro?{' '}
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-[#D4AF37] font-bold hover:underline"
              >
                Faça Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
