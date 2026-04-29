import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, Loader2, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // --- LOGIN COM EMAIL/SENHA ---
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Conta criada! Verifique seu email para confirmar.'); // Em produção, use um Toast/Aviso melhor
        setIsSignUp(false); // Volta para login
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess(); // Fecha modal
      }
    } catch (err) {
      const error = err as Error; 
      setError(error.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN COM GOOGLE ---
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin // Volta para localhost ou seu domínio
        }
      });
      if (error) throw error;
    } catch (err) {
      if (err instanceof Error) {
        setError('Erro ao autenticar com o Google: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`border border-slate-200 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl transition-colors duration-300 ${isSignUp ? 'bg-green-50' : 'bg-white'}`}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mb-3 border border-brand-500/20">
            <LogIn size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isSignUp ? 'Criar sua conta' : 'Acessar ClickDish'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Nutrição saudável pode ser divertida e social !
          </p>
        </div>

        {/* --- BOTÃO GOOGLE --- */}
        <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-2.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg font-bold transition-all flex justify-center items-center gap-3 mb-4 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin text-slate-400" size={20} /> : (
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
               </svg>
            )}
            Continuar com Google
        </button>

        {/* --- DIVISOR --- */}
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-medium uppercase">ou email</span>
            <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* --- FORMULÁRIO EMAIL --- */}
        <form onSubmit={handleEmailAuth} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 text-slate-500 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input 
                type="password" 
                required
                minLength={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignUp ? 'Cadastrar Gratuitamente' : 'Entrar na Conta'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            {isSignUp ? 'Já possui cadastro?' : 'Primeira vez aqui?'}
          </span>
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="ml-2 text-brand-500 hover:text-brand-400 font-bold transition-colors"
          >
            {isSignUp ? 'Fazer Login' : 'Criar Conta Grátis!'}
          </button>
        </div>

      </div>
    </div>
  );
}