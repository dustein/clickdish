import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, RefreshCw } from 'lucide-react';
import { getDeviceId } from './lib/storage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { toPng } from 'html-to-image';

// Seus Componentes
import { AuthModal } from './components/AuthModal';
import { UpgradeModal } from './components/UpgradeModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { DishHistory } from './components/DishHistory';
import ResultCard from './components/ResultCard';
import ResultCardPreview from './components/ResultCardPreview';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ErrorAlert } from './components/ErrorAlert';
import { Button } from './components/Button';

interface AnalysisItem {
  name: string;
  calories_est: number;
  health_score: number;
  box_2d: [number, number, number, number]; 
}

interface AnalysisResult {
  items: AnalysisItem[];
  total_vitality: number;
  recommendation: string;
  comentary: string;
  meal_name?: string; 
}

const loadingPhrases = [
  "Afiando as facas da IA... 🔪",
  "Aquecendo as panelas... 🔥",
  "Identificando os ingredientes... 🥦🍗",
  "Calculando macros e calorias... 🧾",
  "Temperando os dados... 🧂",
  "Quase lá! Finalizando o empratamento... 🍽️"
];

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);

  const deviceId = getDeviceId();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length), 2500);
    } else {
      setPhraseIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLogout = async () => await supabase.auth.signOut();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setResult(null);
      setError(null);

      // Converte para base64 para que o html-to-image consiga embutir
      // a imagem no canvas sem problemas com blob: URLs
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', image);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'X-Device-ID': deviceId,
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      //Para desenvolvimento local usar a linha abaixo
      // const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });

      //Para produção usar a linha abaixo
      const response = await axios.post('/api/analyze-dish', formData, { headers });

      setResult(response.data.analysis);
      
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          setError({ title: 'Muitas tentativas!', msg: 'Aguarde 1 minuto.' });
        } else if (err.response?.status === 402) {
          if (session) {
            // Usuário logado esgotou a cota → convidar para assinar
            setIsUpgradeModalOpen(true);
          } else {
            // Usuário anônimo esgotou a cota → convidar para criar conta
            setError({ title: 'Limite Atingido', msg: 'Crie uma conta gratuita para continuar!' });
            setIsAuthModalOpen(true);
          }
        } else {
          setError({ title: 'Erro no Servidor', msg: 'Tente novamente.' });
        }
      } else setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
    } finally {
      setLoading(false);
    }
  };

  const handleShareImage = async () => {
    const cardElement = document.getElementById('resultado-clickdish');
    if (!cardElement) return;

    // ═══════════════════════════════════════════════════════════════════════
    // ESTRATÉGIA FINAL — wrapper off-screen + clone com position:relative
    //
    // O html-to-image serializa o elemento para SVG e inline todos os
    // computed styles. Se o próprio elemento capturado tiver
    // "position: absolute; top: -9999px", esse valor fica inlinado na
    // clone-of-clone dentro do SVG → conteúdo a -9999px → canvas em branco.
    //
    // Solução:
    //  • Um WRAPPER fica em top:-9999px (invisível ao usuário)
    //  • O CLONE dentro do wrapper tem position:relative;top:0 → fica na
    //    origem (0,0) do SVG → canvas mostra o conteúdo completo
    //  • O clone mede 1080×1350 → getComputedStyle de todos os filhos
    //    retorna valores baseados em 1080px → layout correto e sem cortes
    // ═══════════════════════════════════════════════════════════════════════

    const EXPORT_W = 1080;
    const EXPORT_H = 1350;

    // Wrapper off-screen (só ele vai para -9999px)
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute;
      top: -${EXPORT_H + 100}px;
      left: 0;
      width: ${EXPORT_W}px;
      height: ${EXPORT_H}px;
      overflow: hidden;
    `;

    // O #resultado-clickdish é o wrapper invisível; o filho é o ResultCard real
    // (já renderizado pelo React com dimensões 1080×1350 e position:relative)
    const resultCardEl = cardElement.firstElementChild as HTMLElement | null;
    if (!resultCardEl) return;

    // Clone com position:relative confirmado (já é a classe padrão do ResultCard)
    // + dimensões de exportação explícitas
    const clone = resultCardEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    clone.style.top = '0px';
    clone.style.left = '0px';
    clone.style.width = `${EXPORT_W}px`;
    clone.style.height = `${EXPORT_H}px`;
    clone.style.maxWidth = 'none';
    clone.style.overflow = 'hidden';
    clone.removeAttribute('id'); // evita ids duplicados

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Aguarda o browser recalcular o layout do clone a 1080px
    // (w-full → 1080px, h-full → 1350px, flex-1 distribui corretamente)
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      // Captura o CLONE (position:relative;top:0) — não o wrapper
      const dataUrl = await toPng(clone, {
        width: EXPORT_W,
        height: EXPORT_H,
        pixelRatio: 1,
        // Sem backgroundColor hardcoded — o card define o próprio fundo via style inline
      });

      // Compartilha ou baixa
      let sharedSuccessfully = false;
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'clickdish-analise.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Meu prato no ClickDish!',
            text: 'Olha a análise nutricional do meu prato feita pela IA do ClickDish! 🥗⚡',
          });
          sharedSuccessfully = true;
        }
      } catch (shareError) {
        console.warn('Compartilhamento nativo cancelado.', shareError);
      }

      if (!sharedSuccessfully) {
        const link = document.createElement('a');
        link.download = 'clickdish-analise.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Erro fatal ao renderizar o Card:', error);
      alert('Ops! Tivemos um problema para gerar a imagem do seu prato. Tente novamente.');
    } finally {
      document.body.removeChild(wrapper);
    }
  };


  // NOVA FUNÇÃO: Reseta o estado para tirar uma nova foto
  const handleReset = () => {
    setResult(null);
    setImage(null);
    setPreview(null);
    setError(null);

  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      {session && (
        <UserDashboardModal
          isOpen={isDashboardOpen}
          session={session}
          onClose={() => setIsDashboardOpen(false)}
          onLogout={handleLogout}
          onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        />
      )}

      <Header
        session={session}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onDashboardClick={() => setIsDashboardOpen(true)}
      />

      <main className="w-full flex-1 flex flex-col gap-6">
        
        {/* ============================================================== */}
        {/* TELA 1: CÂMERA E BOTÃO DE ANÁLISE (Oculta quando há resultado) */}
        {/* ============================================================== */}
        {!result && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <ImageUploader 
              image={image} 
              preview={preview} 
              loading={loading} 
              phraseIndex={phraseIndex} 
              loadingPhrases={loadingPhrases} 
              onFileChange={handleFileChange} 
            />

            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!image}
              isLoading={loading}
              loadingText="Preparando Análise..."
              icon={<Upload size={20} />}
            >
              Analisar Prato
            </Button>
          </div>
        )}

        {error && <ErrorAlert error={error} session={session} onLoginClick={() => setIsAuthModalOpen(true)} />}

        {/* ============================================================== */}
        {/* TELA 2: RESULTADO FINAL (Aparece limpa ocupando o espaço)      */}
        {/* ============================================================== */}
        {result && preview && !loading && (
          <div className="w-full flex flex-col gap-4 mb-10 animate-fade-in">
            
            {/* Preview compacto para a tela do celular — design otimizado
                para viewport estreita. O ResultCard completo (1080×1350)
                só é renderizado durante a exportação, via clone off-screen. */}
            <ResultCardPreview data={result} imageSrc={preview} />

            {/* Dica de recomendação — exibida fora do card, apenas para o usuário */}
            {result.recommendation && (
              <div className="w-full px-4 py-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex gap-3 items-start">
                <span className="text-brand-600 text-lg mt-0.5">💡</span>
                <p className="text-sm text-brand-700 font-medium leading-relaxed">{result.recommendation}</p>
              </div>
            )}

            {/* Elemento invisível contendo o ResultCard de exportação a 1080×1350 px.
                Está fora da viewport (left: -9999px) mas com dimensões reais para que
                o browser compute o layout correto, usado depois pelo clone de exportação. */}
            <div
              id="resultado-clickdish"
              aria-hidden="true"
              style={{
                position: 'fixed',
                left: '-9999px',
                top: 0,
                width: '1080px',
                height: '1350px',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: -1,
              }}
            >
              <ResultCard data={result} imageSrc={preview} />
            </div>
            
            {/* Botão Principal de Compartilhamento */}
            <Button
              variant="gradient"
              onClick={handleShareImage}
              icon={<Download size={20} />}
            >
              Compartilhar no Instagram
            </Button>

            {/* Novo Botão Secundário para voltar/resetar o App */}
            <button 
              onClick={handleReset}
              className="mt-2 text-sm font-bold text-slate-500 hover:text-brand-600 flex items-center justify-center gap-2 transition-colors py-2"
            >
              <RefreshCw size={16} /> Analisar outro prato
            </button>
            
          </div>
        )}

        {session ? <DishHistory /> : null}
      </main>
    </div>
  );
}

export default App;





