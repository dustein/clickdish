// // import { useState, useEffect } from 'react';
// // import axios from 'axios';
// // import { Camera, Upload, Loader2, Utensils, AlertTriangle, Lock, LogIn, User, Download } from 'lucide-react';
// // import { getDeviceId } from './lib/storage';
// // import { supabase } from './lib/supabase';
// // import type { Session } from '@supabase/supabase-js';
// // import { AuthModal } from './components/AuthModal';
// // import { DishHistory } from './components/DishHistory';

// // // Importações para o novo visual e exportação
// // import { toPng } from 'html-to-image';
// // import ResultCard from './components/ResultCard';

// // // ATUALIZADO: Interface agora inclui as coordenadas (box_2d) e o nome da refeição
// // interface AnalysisItem {
// //   name: string;
// //   calories_est: number;
// //   health_score: number;
// //   box_2d: [number, number, number, number]; 
// // }

// // interface AnalysisResult {
// //   items: AnalysisItem[];
// //   total_vitality: number;
// //   recommendation: string;
// //   comentary: string;
// //   meal_name?: string; 
// // }

// // function App() {
// //   // --- ESTADOS DO APP ---
// //   const [image, setImage] = useState<File | null>(null);
// //   const [preview, setPreview] = useState<string | null>(null);
// //   const [loading, setLoading] = useState(false);
// //   const [result, setResult] = useState<AnalysisResult | null>(null);
// //   const [error, setError] = useState<{title: string, msg: string} | null>(null);

// //   // --- ESTADOS DE LOGIN ---
// //   const [session, setSession] = useState<Session | null>(null);
// //   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

// //   const deviceId = getDeviceId();

// //   // Efeito: Verifica se já existe alguém logado ao abrir o app
// //   useEffect(() => {
// //     supabase.auth.getSession().then(({ data: { session } }) => {
// //       setSession(session);
// //     });

// //     // Escuta mudanças (login/logout) em tempo real
// //     const {
// //       data: { subscription },
// //     } = supabase.auth.onAuthStateChange((_event, session) => {
// //       setSession(session);
// //     });

// //     return () => subscription.unsubscribe();
// //   }, []);

// //   const handleLogout = async () => {
// //     await supabase.auth.signOut();
// //   };

// //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     if (e.target.files && e.target.files[0]) {
// //       const file = e.target.files[0];
// //       setImage(file);
// //       setPreview(URL.createObjectURL(file));
// //       setResult(null);
// //       setError(null);
// //     }
// //   };

// //   const handleAnalyze = async () => {
// //     if (!image) return;

// //     setLoading(true);
// //     setError(null);

// //     const formData = new FormData();
// //     formData.append('file', image);

// //     try {
// //       const headers: Record<string, string> = {
// //         'Content-Type': 'multipart/form-data',
// //         'X-Device-ID': deviceId,
// //       };

// //       // Se logado, adiciona o token
// //       if (session?.access_token) {
// //         headers['Authorization'] = `Bearer ${session.access_token}`;
// //       }

// //       // =================================================================
// //       // ⚠️ 1. CÓDIGO DA API REAL (COMENTADO TEMPORARIAMENTE PARA TESTE)
// //       // =================================================================
      
// //       const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });
// //       setResult(response.data.analysis);
      

// //       // =================================================================
// //       // 🧪 2. DADO MOCKADO (FALSO) PARA TESTAR O VISUAL E AS SETAS
// //       // =================================================================
// //       // await new Promise(resolve => setTimeout(resolve, 1500)); // Finge que a API demorou 1.5s
      
// //       // setResult({
// //       //   meal_name: "Combustível de Elite",
// //       //   items: [
// //       //     { name: '12 Ovos Mexidos', calories_est: 840, health_score: 10, box_2d: [300, 200, 700, 600] },
// //       //     { name: 'Brócolis', calories_est: 55, health_score: 10, box_2d: [150, 600, 400, 950] }
// //       //   ],
// //       //   total_vitality: 95,
// //       //   recommendation: 'Excelente carga proteica para recuperação muscular e saciedade.',
// //       //   comentary: 'Nutrição pesada e estratégica. 💪'
// //       // });
// //       // =================================================================
      
// //     } catch (err: unknown) {
// //       console.error(err);
      
// //       if (axios.isAxiosError(err)) {
// //         if (err.response?.status === 429) {
// //             setError({ title: "Muitas tentativas!", msg: "Aguarde 1 minuto." });
// //         } else if (err.response?.status === 402) {
// //             setError({ title: "Limite Atingido", msg: session ? "Seus créditos acabaram." : "Crie uma conta para continuar!" });
// //             if (!session) setIsAuthModalOpen(true);
// //         } else {
// //             setError({ title: "Erro no Servidor", msg: "Tente novamente." });
// //         }
// //       } else {
// //         setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
// //       }
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   // Função para exportar a imagem em alta qualidade
// //   const handleDownloadImage = async () => {
// //     const cardElement = document.getElementById('resultado-clickdish');
// //     if (!cardElement) return;

// //     try {
// //       const dataUrl = await toPng(cardElement, { 
// //         pixelRatio: 3, 
// //         cacheBust: true 
// //       });
// //       const link = document.createElement('a');
// //       link.download = 'clickdish-analise.png';
// //       link.href = dataUrl;
// //       link.click();
// //     } catch (error) {
// //       console.error('Erro ao gerar a imagem:', error);
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
      
// //       {/* O MODAL DE LOGIN */}
// //       <AuthModal 
// //         isOpen={isAuthModalOpen} 
// //         onClose={() => setIsAuthModalOpen(false)} 
// //         onSuccess={() => setIsAuthModalOpen(false)}
// //       />

// //       {/* Cabeçalho */}
// //       <header className="w-full flex items-center justify-between py-6">
// //         <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
// //           <Utensils className="fill-brand-500 text-slate-900" /> ClickDish
// //         </h1>

// //         {/* ÁREA DE LOGIN NO CABEÇALHO */}
// //         <div className="flex items-center gap-3">
// //             {session ? (
// //                 <div className="flex items-center gap-2">
// //                     <div className="text-xs text-right hidden sm:block">
// //                         <p className="text-slate-300 font-bold">Olá, Chef</p>
// //                         <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">Sair</button>
// //                     </div>
// //                     <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center border border-brand-500/50">
// //                         <User size={16} className="text-brand-400" />
// //                     </div>
// //                 </div>
// //             ) : (
// //                 <button 
// //                     onClick={() => setIsAuthModalOpen(true)}
// //                     className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-brand-500 transition-colors flex items-center gap-2"
// //                 >
// //                     <LogIn size={14} /> Entrar
// //                 </button>
// //             )}
// //         </div>
// //       </header>

// //       <main className="w-full flex-1 flex flex-col gap-6">
        
// //         {/* Box da Câmera/Preview */}
// //         <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
// //           {preview ? (
// //             <img src={preview} alt="Prato" className="w-full h-full object-cover" />
// //           ) : (
// //             <div className="text-slate-400 flex flex-col items-center group-hover:text-brand-500 transition-colors">
// //               <div className="p-4 bg-slate-700 rounded-full mb-3 group-hover:bg-brand-900/30 transition-colors">
// //                 <Camera size={32} />
// //               </div>
// //               <p className="font-medium">Toque para fotografar</p>
// //             </div>
// //           )}
          
// //           <input 
// //             type="file" 
// //             accept="image/*" 
// //             className="absolute inset-0 opacity-0 cursor-pointer"
// //             onChange={handleFileChange}
// //           />
// //         </div>

// //         {/* Botão Analisar */}
// //         <button
// //           onClick={handleAnalyze}
// //           disabled={!image || loading}
// //           className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
// //         >
// //           {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
// //           {loading ? 'Analisando Calorias...' : 'Analisar Prato'}
// //         </button>

// //         {/* Exibição de Erros */}
// //         {error && (
// //           <div className={`p-4 rounded-xl flex gap-3 ${error.title.includes('Muitas') ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
// //             {error.title.includes('Muitas') ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
// //             <div>
// //                 <h3 className="font-bold text-sm">{error.title}</h3>
// //                 <p className="text-xs opacity-90">{error.msg}</p>
// //                 {!session && error.title.includes('Limite') && (
// //                     <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold underline mt-1 text-brand-400">
// //                         Entrar agora
// //                     </button>
// //                 )}
// //             </div>
// //           </div>
// //         )}

// //         {/* NOVA ÁREA DE RESULTADO (CARD + BOTÃO DE DOWNLOAD) */}
// //         {result && preview && (
// //           <div className="w-full flex flex-col gap-4 mb-10 animate-fade-in">
            
// //             <ResultCard 
// //               id="resultado-clickdish" 
// //               data={result} 
// //               imageSrc={preview} 
// //             />

// //             <button 
// //               onClick={handleDownloadImage}
// //               className="w-full py-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-brand-400 font-bold rounded-xl border border-brand-500/30 transition-all shadow-lg active:scale-95"
// //             >
// //               <Download size={20} />
// //               Salvar Imagem para Compartilhar
// //             </button>

// //           </div>
// //         )}

// //         {session ? <DishHistory /> : null}
// //       </main>
// //     </div>
// //   );
// // }

// // export default App;



// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Camera, Upload, Loader2, Utensils, AlertTriangle, Lock, LogIn, User, Download } from 'lucide-react';
// import { getDeviceId } from './lib/storage';
// import { supabase } from './lib/supabase';
// import type { Session } from '@supabase/supabase-js';
// import { AuthModal } from './components/AuthModal';
// import { DishHistory } from './components/DishHistory';

// // Importações para o novo visual e exportação
// import { toPng } from 'html-to-image';
// import ResultCard from './components/ResultCard';

// // ATUALIZADO: Interface agora inclui as coordenadas (box_2d) e o nome da refeição
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

// function App() {
//   // --- ESTADOS DO APP ---
//   const [image, setImage] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState<AnalysisResult | null>(null);
//   const [error, setError] = useState<{title: string, msg: string} | null>(null);

//   // --- ESTADOS DE LOGIN ---
//   const [session, setSession] = useState<Session | null>(null);
//   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

//   const deviceId = getDeviceId();

//   // Efeito: Verifica se já existe alguém logado ao abrir o app
//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//     });

//     // Escuta mudanças (login/logout) em tempo real
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//   };

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

//       // Se logado, adiciona o token
//       if (session?.access_token) {
//         headers['Authorization'] = `Bearer ${session.access_token}`;
//       }

//       const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });
//       setResult(response.data.analysis);
      
//     } catch (err: unknown) {
//       console.error(err);
      
//       if (axios.isAxiosError(err)) {
//         if (err.response?.status === 429) {
//             setError({ title: "Muitas tentativas!", msg: "Aguarde 1 minuto." });
//         } else if (err.response?.status === 402) {
//             setError({ title: "Limite Atingido", msg: session ? "Seus créditos acabaram." : "Crie uma conta para continuar!" });
//             if (!session) setIsAuthModalOpen(true);
//         } else {
//             setError({ title: "Erro no Servidor", msg: "Tente novamente." });
//         }
//       } else {
//         setError({ title: "Erro", msg: "Ocorreu um erro inesperado." });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Função para exportar e compartilhar a imagem (Instagram/WhatsApp)
//   // Função para exportar e compartilhar a imagem (Instagram/WhatsApp)
//   // Função para exportar e compartilhar a imagem (Instagram/WhatsApp)
//   // Função para exportar e compartilhar a imagem (Instagram/WhatsApp)
//   const handleShareImage = async () => {
//     const cardElement = document.getElementById('resultado-clickdish');
//     if (!cardElement) return;

//     try {
//       // 1. Gera a imagem
//       const dataUrl = await toPng(cardElement, { 
//         pixelRatio: 2, // 2x garante boa qualidade sem estourar a memória
//         backgroundColor: '#0f172a' 
//       });

//       let sharedSuccessfully = false;

//       // 2. Tenta usar a Web Share API (Gaveta nativa do celular)
//       try {
//         const response = await fetch(dataUrl);
//         const blob = await response.blob();
//         const file = new File([blob], 'clickdish-analise.png', { type: 'image/png' });

//         if (navigator.canShare && navigator.canShare({ files: [file] })) {
//           await navigator.share({
//             files: [file],
//             title: 'Meu prato no ClickDish!',
//             text: 'Olha a análise nutricional do meu prato feita pela IA do ClickDish! 🥗⚡',
//           });
//           sharedSuccessfully = true;
//         }
//       } catch (shareError) {
//         console.warn('O compartilhamento nativo foi bloqueado ou cancelado.', shareError);
//       }

//       // 3. PLANO B (Fallback): Download direto se o share falhar ou for PC
//       if (!sharedSuccessfully) {
//         const link = document.createElement('a');
//         link.download = 'clickdish-analise.png';
//         link.href = dataUrl;
//         link.click();
//       }

//     } catch (error) {
//       console.error('Erro fatal ao renderizar o Card para imagem:', error);
//       alert('Ops! Tivemos um problema para gerar a imagem do seu prato. Tente novamente.');
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
      
//       {/* O MODAL DE LOGIN */}
//       <AuthModal 
//         isOpen={isAuthModalOpen} 
//         onClose={() => setIsAuthModalOpen(false)} 
//         onSuccess={() => setIsAuthModalOpen(false)}
//       />

//       {/* Cabeçalho */}
//       <header className="w-full flex items-center justify-between py-6">
//         <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
//           <Utensils className="fill-brand-500 text-slate-900" /> ClickDish
//         </h1>

//         {/* ÁREA DE LOGIN NO CABEÇALHO */}
//         <div className="flex items-center gap-3">
//             {session ? (
//                 <div className="flex items-center gap-2">
//                     <div className="text-xs text-right hidden sm:block">
//                         <p className="text-slate-300 font-bold">Olá, Chef</p>
//                         <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">Sair</button>
//                     </div>
//                     <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center border border-brand-500/50">
//                         <User size={16} className="text-brand-400" />
//                     </div>
//                 </div>
//             ) : (
//                 <button 
//                     onClick={() => setIsAuthModalOpen(true)}
//                     className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-brand-500 transition-colors flex items-center gap-2"
//                 >
//                     <LogIn size={14} /> Entrar
//                 </button>
//             )}
//         </div>
//       </header>

//       <main className="w-full flex-1 flex flex-col gap-6">
        
//         {/* Box da Câmera/Preview */}
//         <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
//           {preview ? (
//             <img src={preview} alt="Prato" className="w-full h-full object-cover" />
//           ) : (
//             <div className="text-slate-400 flex flex-col items-center group-hover:text-brand-500 transition-colors">
//               <div className="p-4 bg-slate-700 rounded-full mb-3 group-hover:bg-brand-900/30 transition-colors">
//                 <Camera size={32} />
//               </div>
//               <p className="font-medium">Toque para fotografar</p>
//             </div>
//           )}
          
//           <input 
//             type="file" 
//             accept="image/*" 
//             className="absolute inset-0 opacity-0 cursor-pointer"
//             onChange={handleFileChange}
//           />
//         </div>

//         {/* Botão Analisar */}
//         <button
//           onClick={handleAnalyze}
//           disabled={!image || loading}
//           className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
//         >
//           {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
//           {loading ? 'Analisando Calorias...' : 'Analisar Prato'}
//         </button>

//         {/* Exibição de Erros */}
//         {error && (
//           <div className={`p-4 rounded-xl flex gap-3 ${error.title.includes('Muitas') ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
//             {error.title.includes('Muitas') ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
//             <div>
//                 <h3 className="font-bold text-sm">{error.title}</h3>
//                 <p className="text-xs opacity-90">{error.msg}</p>
//                 {!session && error.title.includes('Limite') && (
//                     <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold underline mt-1 text-brand-400">
//                         Entrar agora
//                     </button>
//                 )}
//             </div>
//           </div>
//         )}

//         {/* NOVA ÁREA DE RESULTADO (CARD + BOTÃO DE DOWNLOAD) */}
//         {result && preview && (
//           <div className="w-full flex flex-col gap-4 mb-10 animate-fade-in">
            
//             <ResultCard 
//               id="resultado-clickdish" 
//               data={result} 
//               imageSrc={preview} 
//             />

//             {/* O NOVO BOTÃO DE COMPARTILHAMENTO */}
//             <button 
//               onClick={handleShareImage}
//               className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-xl border border-orange-400/50 transition-all shadow-lg shadow-orange-500/30 active:scale-95 uppercase tracking-wide text-sm"
//             >
//               <Download size={20} />
//               Compartilhar no Instagram
//             </button>

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
import { Camera, Upload, Loader2, Utensils, AlertTriangle, Lock, LogIn, User, Download, ChefHat } from 'lucide-react';
import { getDeviceId } from './lib/storage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { AuthModal } from './components/AuthModal';
import { DishHistory } from './components/DishHistory';
import { toPng } from 'html-to-image';
import ResultCard from './components/ResultCard';

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

// 1. AS FRASES DIVERTIDAS DE CARREGAMENTO
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

  // 2. ESTADO PARA CONTROLAR A FRASE ATUAL
  const [phraseIndex, setPhraseIndex] = useState(0);

  const deviceId = getDeviceId();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. EFEITO QUE TROCA A FRASE A CADA 2.5 SEGUNDOS DURANTE O LOADING
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
    } else {
      setPhraseIndex(0); // Reseta quando termina
    }
    return () => clearInterval(interval);
  }, [loading]);

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
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'X-Device-ID': deviceId,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, { headers });
      setResult(response.data.analysis);
      
    } catch (err: unknown) {
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

  const handleShareImage = async () => {
    const cardElement = document.getElementById('resultado-clickdish');
    if (!cardElement) return;

    try {
      const dataUrl = await toPng(cardElement, { 
        pixelRatio: 2, 
        backgroundColor: '#0f172a' 
      });

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

  return (
    <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans relative">
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      <header className="w-full flex items-center justify-between py-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
          <Utensils className="fill-brand-500 text-slate-900" /> ClickDish
        </h1>

        <div className="flex items-center gap-3">
            {session ? (
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
        
        <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
          
          {/* 4. A NOVA CAMADA (OVERLAY) DE LOADING */}
          {loading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl animate-fade-in">
              <div className="relative mb-4">
                <ChefHat size={56} className="text-orange-500 animate-bounce" />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-1">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              </div>
              <p className="text-orange-400 font-bold text-lg text-center px-6 animate-pulse transition-opacity duration-300">
                {loadingPhrases[phraseIndex]}
              </p>
            </div>
          )}

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
            // Bloqueia clicar para tirar nova foto enquanto carrega
            disabled={loading}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          {loading ? 'Preparando Análise...' : 'Analisar Prato'}
        </button>

        {error && (
          <div className={`p-4 rounded-xl flex gap-3 ${error.title.includes('Muitas') ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
            {error.title.includes('Muitas') ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
            <div>
                <h3 className="font-bold text-sm">{error.title}</h3>
                <p className="text-xs opacity-90">{error.msg}</p>
                {!session && error.title.includes('Limite') && (
                    <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold underline mt-1 text-brand-400">
                        Entrar agora
                    </button>
                )}
            </div>
          </div>
        )}

        {result && preview && !loading && (
          <div className="w-full flex flex-col gap-4 mb-10 animate-fade-in">
            <ResultCard 
              id="resultado-clickdish" 
              data={result} 
              imageSrc={preview} 
            />
            <button 
              onClick={handleShareImage}
              className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-xl border border-orange-400/50 transition-all shadow-lg shadow-orange-500/30 active:scale-95 uppercase tracking-wide text-sm"
            >
              <Download size={20} />
              Compartilhar no Instagram
            </button>
          </div>
        )}

        {session ? <DishHistory /> : null}
      </main>
    </div>
  );
}

export default App;