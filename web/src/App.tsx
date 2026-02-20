import { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, Loader2, Utensils, AlertTriangle, Lock, ChefHat, LogIn, User } from 'lucide-react';
import { getDeviceId } from './lib/storage';
import { supabase } from './lib/supabase'; // Conexão com Supabase
import { AuthModal } from './components/AuthModal'; // O Modal que criamos
import type { Session } from '@supabase/supabase-js';

// Interface que espelha a resposta do Gemini/Backend
interface AnalysisResult {
  items: Array<{ name: string; calories_est: number; health_score: number }>;
  total_vitality: number;
  recommendation: string;
  comentary: string;
}

function App() {
  // --- ESTADOS DO APP ---
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  // --- ESTADOS DE LOGIN ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const deviceId = getDeviceId();

  // Efeito: Verifica se já existe alguém logado ao abrir o app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuta mudanças (login/logout) em tempo real
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', image);

    try {
      // CORREÇÃO 1: Tipagem correta dos headers (em vez de any)
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'X-Device-ID': deviceId,
      };

      // Se logado, adiciona o token
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });

      setResult(response.data.analysis);
      
    } catch (err) { // <--- CORREÇÃO 2: Removido o ": any". O TS infere como 'unknown'
      console.error(err);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
            setError({ title: "Muitas tentativas!", msg: "Aguarde 1 minuto." });
        } else if (err.response?.status === 402) {
            setError({ title: "Limite Atingido", msg: session ? "Seus créditos acabaram." : "Crie uma conta para continuar!" });
            if (!session) setIsAuthModalOpen(true);
        } else {
            setError({ title: "Erro no Servidor", msg: "Tente novamente." });
        }
      } else {
        setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
      
      {/* O MODAL DE LOGIN (Invisível até isAuthModalOpen ser true) */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Cabeçalho */}
      <header className="w-full flex items-center justify-between py-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
          <Utensils className="fill-brand-500 text-slate-900" /> ClickDish
        </h1>

        {/* ÁREA DE LOGIN NO CABEÇALHO */}
        <div className="flex items-center gap-3">
            {session ? (
                // USUÁRIO LOGADO
                <div className="flex items-center gap-2">
                    <div className="text-xs text-right hidden sm:block">
                        <p className="text-slate-300 font-bold">Olá, Chef</p>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">Sair</button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center border border-brand-500/50">
                        <User size={16} className="text-brand-400" />
                    </div>
                </div>
            ) : (
                // USUÁRIO DESLOGADO
                <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-brand-500 transition-colors flex items-center gap-2"
                >
                    <LogIn size={14} /> Entrar
                </button>
            )}
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col gap-6">
        {/* ... (O resto do código de Upload/Câmera continua igual) ... */}
        
        <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
          {preview ? (
            <img src={preview} alt="Prato" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 flex flex-col items-center group-hover:text-brand-500 transition-colors">
              <div className="p-4 bg-slate-700 rounded-full mb-3 group-hover:bg-brand-900/30 transition-colors">
                <Camera size={32} />
              </div>
              <p className="font-medium">Toque para fotografar</p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          {loading ? 'Analisando Calorias...' : 'Analisar Prato'}
        </button>

        {error && (
          <div className={`p-4 rounded-xl flex gap-3 ${error.title.includes('Muitas') ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
            {error.title.includes('Muitas') ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
            <div>
                <h3 className="font-bold text-sm">{error.title}</h3>
                <p className="text-xs opacity-90">{error.msg}</p>
                {/* Link "Entrar agora" se der erro de limite */}
                {!session && error.title.includes('Limite') && (
                    <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold underline mt-1 text-brand-400">
                        Entrar agora
                    </button>
                )}
            </div>
          </div>
        )}

        {result && (
          <div className="bg-slate-800 rounded-2xl p-6 space-y-5 animate-fade-in border border-slate-700 shadow-xl mb-10">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h2 className="text-lg font-bold text-white flex gap-2 items-center"><ChefHat size={18} className="text-brand-500"/> Análise</h2>
              <div className="flex flex-col items-end">
                <span className="text-brand-500 font-black text-4xl leading-none">{result.total_vitality}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider">HEALTH SCORE</span>
              </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-slate-300 italic text-center text-sm">"{result.comentary}"</p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Composição do Prato</h3>
              {result.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-slate-700/30 p-3 rounded-lg">
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.health_score >= 7 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {item.health_score}/10
                    </div>
                    <span className="text-slate-400 font-bold w-16 text-right">{item.calories_est} kcal</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="bg-brand-900/20 border border-brand-500/30 p-4 rounded-xl">
                <h3 className="text-xs font-bold text-brand-500 mb-1 flex items-center gap-1 uppercase">✨ Dica Nutricional</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;