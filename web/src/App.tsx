// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Upload, Download } from 'lucide-react';
// import { getDeviceId } from './lib/storage';
// import { supabase } from './lib/supabase';
// import type { Session } from '@supabase/supabase-js';
// import { toPng } from 'html-to-image';

// // Seus Componentes
// import { AuthModal } from './components/AuthModal';
// import { DishHistory } from './components/DishHistory';
// import ResultCard from './components/ResultCard';
// import { Header } from './components/Header';
// import { ImageUploader } from './components/ImageUploader';
// import { ErrorAlert } from './components/ErrorAlert';
// import { Button } from './components/Button'; // <-- NOVO IMPORT

// interface AnalysisItem {
//   name: string;
//   calories_est: number;
//   health_score: number;
//   box_2d: [number, number, number, number]; 
// }

// interface AnalysisResult {
//   items: AnalysisItem[];
//   total_vitality: number;
//   recommendation: string;
//   comentary: string;
//   meal_name?: string; 
// }

// const loadingPhrases = [
//   "Afiando as facas da IA... 🔪",
//   "Aquecendo as panelas... 🔥",
//   "Identificando os ingredientes... 🥦",
//   "Calculando macros e calorias... 📊",
//   "Temperando os dados... 🧂",
//   "Quase lá! Finalizando o empratamento... 🍽️"
// ];

// function App() {
//   const [image, setImage] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<AnalysisResult | null>(null);
//   const [error, setError] = useState<{title: string, msg: string} | null>(null);
  
//   const [session, setSession] = useState<Session | null>(null);
//   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
//   const [phraseIndex, setPhraseIndex] = useState(0);

//   const deviceId = getDeviceId();

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
//     return () => subscription.unsubscribe();
//   }, []);

//   useEffect(() => {
//     let interval: ReturnType<typeof setInterval>;
//     if (loading) {
//       interval = setInterval(() => setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length), 2500);
//     } else {
//       setPhraseIndex(0);
//     }
//     return () => clearInterval(interval);
//   }, [loading]);

//   const handleLogout = async () => await supabase.auth.signOut();

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       setImage(file);
//       setPreview(URL.createObjectURL(file));
//       setResult(null);
//       setError(null);
//     }
//   };

//   const handleAnalyze = async () => {
//     if (!image) return;
//     setLoading(true);
//     setError(null);

//     const formData = new FormData();
//     formData.append('file', image);

//     try {
//       const headers: Record<string, string> = {
//         'Content-Type': 'multipart/form-data',
//         'X-Device-ID': deviceId,
//       };
//       if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

//       const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });
//       setResult(response.data.analysis);
      
//     } catch (err: unknown) {
//       console.error(err);
//       if (axios.isAxiosError(err)) {
//         if (err.response?.status === 429) setError({ title: "Muitas tentativas!", msg: "Aguarde 1 minuto." });
//         else if (err.response?.status === 402) {
//             setError({ title: "Limite Atingido", msg: session ? "Seus créditos acabaram." : "Crie uma conta para continuar!" });
//             if (!session) setIsAuthModalOpen(true);
//         } else setError({ title: "Erro no Servidor", msg: "Tente novamente." });
//       } else setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleShareImage = async () => {
//     const cardElement = document.getElementById('resultado-clickdish');
//     if (!cardElement) return;

//     try {
//       const dataUrl = await toPng(cardElement, { pixelRatio: 2, backgroundColor: '#0f172a' });
//       let sharedSuccessfully = false;

//       try {
//         const response = await fetch(dataUrl);
//         const blob = await response.blob();
//         const file = new File([blob], 'clickdish-analise.png', { type: 'image/png' });

//         if (navigator.canShare && navigator.canShare({ files: [file] })) {
//           await navigator.share({
//             files: [file], title: 'Meu prato no ClickDish!', text: 'Olha a análise nutricional do meu prato feita pela IA do ClickDish! 🥗⚡'
//           });
//           sharedSuccessfully = true;
//         }
//       } catch (shareError) {
//         console.warn('O compartilhamento nativo foi bloqueado ou cancelado.', shareError);
//       }

//       if (!sharedSuccessfully) {
//         const link = document.createElement('a');
//         link.download = 'clickdish-analise.png';
//         link.href = dataUrl;
//         link.click();
//       }
//     } catch (error) {
//       console.error('Erro fatal ao renderizar o Card:', error);
//       alert('Ops! Tivemos um problema para gerar a imagem do seu prato. Tente novamente.');
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
//       <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />

//       <Header session={session} onLoginClick={() => setIsAuthModalOpen(true)} onLogoutClick={handleLogout} />

//       <main className="w-full flex-1 flex flex-col gap-6">
        
//         <ImageUploader 
//           image={image} 
//           preview={preview} 
//           loading={loading} 
//           phraseIndex={phraseIndex} 
//           loadingPhrases={loadingPhrases} 
//           onFileChange={handleFileChange} 
//         />

//         {/* 1. O BOTÃO DE ANÁLISE COMPONENTIZADO */}
//         <Button
//           variant="primary"
//           onClick={handleAnalyze}
//           disabled={!image}
//           isLoading={loading}
//           loadingText="Preparando Análise..."
//           icon={<Upload size={20} />}
//         >
//           Analisar Prato
//         </Button>

//         {error && <ErrorAlert error={error} session={session} onLoginClick={() => setIsAuthModalOpen(true)} />}

//         {result && preview && !loading && (
//           <div className="w-full flex flex-col gap-4 mb-10 animate-fade-in">
//             <ResultCard id="resultado-clickdish" data={result} imageSrc={preview} />
            
//             {/* 2. O BOTÃO DE COMPARTILHAMENTO COMPONENTIZADO */}
//             <Button
//               variant="gradient"
//               onClick={handleShareImage}
//               icon={<Download size={20} />}
//             >
//               Compartilhar no Instagram
//             </Button>
//           </div>
//         )}

//         {session ? <DishHistory /> : null}
//       </main>
//     </div>
//   );
// }

// export default App;




import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, RefreshCw } from 'lucide-react'; // Adicionei o ícone RefreshCw
import { getDeviceId } from './lib/storage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { toPng } from 'html-to-image';

// Seus Componentes
import { AuthModal } from './components/AuthModal';
import { DishHistory } from './components/DishHistory';
import ResultCard from './components/ResultCard';
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
  "Identificando os ingredientes... 🥦",
  "Calculando macros e calorias... 📊",
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
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'X-Device-ID': deviceId,
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });
      setResult(response.data.analysis);
      
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) setError({ title: "Muitas tentativas!", msg: "Aguarde 1 minuto." });
        else if (err.response?.status === 402) {
            setError({ title: "Limite Atingido", msg: session ? "Seus créditos acabaram." : "Crie uma conta para continuar!" });
            if (!session) setIsAuthModalOpen(true);
        } else setError({ title: "Erro no Servidor", msg: "Tente novamente." });
      } else setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
    } finally {
      setLoading(false);
    }
  };

  const handleShareImage = async () => {
    const cardElement = document.getElementById('resultado-clickdish');
    if (!cardElement) return;

    try {
      const dataUrl = await toPng(cardElement, { pixelRatio: 2, backgroundColor: '#0f172a' });
      let sharedSuccessfully = false;

      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'clickdish-analise.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file], title: 'Meu prato no ClickDish!', text: 'Olha a análise nutricional do meu prato feita pela IA do ClickDish! 🥗⚡'
          });
          sharedSuccessfully = true;
        }
      } catch (shareError) {
        console.warn('O compartilhamento nativo foi bloqueado ou cancelado.', shareError);
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

      <Header session={session} onLoginClick={() => setIsAuthModalOpen(true)} onLogoutClick={handleLogout} />

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
            
            {/* O Card Visual */}
            <ResultCard id="resultado-clickdish" data={result} imageSrc={preview} />
            
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
              className="mt-2 text-sm font-bold text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors py-2"
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





