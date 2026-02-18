import { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, Loader2, Utensils, AlertTriangle, Lock, ChefHat } from 'lucide-react';
import { getDeviceId } from './lib/storage';

// Interface que espelha a resposta do Gemini/Backend
interface AnalysisResult {
  items: Array<{ name: string; calories_est: number; health_score: number }>;
  total_vitality: number;
  recommendation: string;
  comentary: string;
}

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<{title: string, msg: string} | null>(null);

  // Recupera ou cria o ID do dispositivo
  const deviceId = getDeviceId();

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
      // AJUSTE: Garanta que a URL bate com seu backend rodando
      const response = await axios.post('http://127.0.0.1:8000/analyze-dish', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Device-ID': deviceId // Envia o ID para o Backend validar
        }
      });

      setResult(response.data.analysis);
    } catch (err) { // <--- Remova o ": any"
      console.error(err);
      
      // Verifica se o erro veio do Axios (requisição HTTP)
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 429) {
          setError({
              title: "Muitas tentativas!", 
              msg: "O sistema de segurança bloqueou requisições rápidas demais. Aguarde 1 minuto."
          });
        } else if (err.response?.status === 402) {
          setError({
              title: "Limite Gratuito Atingido", 
              msg: "Você usou seus créditos gratuitos neste dispositivo."
          });
        } else {
          setError({
              title: "Erro no Servidor", 
              msg: "Não foi possível analisar o prato. Tente novamente."
          });
        }
      } else {
        // Erro genérico (não foi o Axios, pode ser erro de código no front)
        setError({
            title: "Erro Desconhecido", 
            msg: "Ocorreu um erro inesperado na aplicação."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 max-w-md mx-auto font-sans">
      {/* Cabeçalho */}
      <header className="w-full flex items-center justify-between py-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
          <Utensils className="fill-brand-500 text-slate-900" /> ClickDish
        </h1>
        <div className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700">
          ID: {deviceId.slice(0, 4)}...
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col gap-6">
        {/* Área de Upload / Câmera */}
        <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
          {preview ? (
            <img src={preview} alt="Prato" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 flex flex-col items-center group-hover:text-brand-500 transition-colors">
              <div className="p-4 bg-slate-700 rounded-full mb-3 group-hover:bg-brand-900/30 transition-colors">
                <Camera size={32} />
              </div>
              <p className="font-medium">Toque para fotografar</p>
              <p className="text-xs text-slate-500 mt-1">ou envie da galeria</p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
        </div>

        {/* Botão de Ação */}
        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          {loading ? 'Analisando Calorias...' : 'Analisar Prato'}
        </button>

        {/* Exibição de Erros */}
        {error && (
          <div className={`p-4 rounded-xl flex gap-3 ${error.title.includes('Muitas') ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
            {error.title.includes('Muitas') ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
            <div>
                <h3 className="font-bold text-sm">{error.title}</h3>
                <p className="text-xs opacity-90">{error.msg}</p>
            </div>
          </div>
        )}

        {/* Resultado da Análise */}
        {result && (
          <div className="bg-slate-800 rounded-2xl p-6 space-y-5 animate-fade-in border border-slate-700 shadow-xl mb-10">
            {/* Score */}
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h2 className="text-lg font-bold text-white flex gap-2 items-center"><ChefHat size={18} className="text-brand-500"/> Análise</h2>
              <div className="flex flex-col items-end">
                <span className="text-brand-500 font-black text-4xl leading-none">{result.total_vitality}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider">HEALTH SCORE</span>
              </div>
            </div>
            
            {/* Comentário IA */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <p className="text-slate-300 italic text-center text-sm">"{result.comentary}"</p>
            </div>
            
            {/* Lista de Itens */}
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

            {/* Dica */}
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