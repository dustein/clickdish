import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Caminho baseado no seu App.tsx

// Tipagem baseada na estrutura exata que está a chegar do seu banco de dados
interface AnalysisLog {
  id: string; // <-- Corrigido para string (UUID)
  created_at: string;
  raw_result: {
    items: { name: string; calories_est: number; health_score: number }[];
    total_vitality: number;
    recommendation: string;
    comentary: string;
  };
}

export const DishHistory: React.FC = () => {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Pega o usuário logado atualmente
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Busca os pratos desse usuário, do mais recente para o mais antigo
      const { data, error } = await supabase
        .from('analysis_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Carregando o seu histórico...</div>;

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 mt-6 animate-fade-in shadow-sm">
        <p className="text-slate-500">Ainda não analisou nenhum prato.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-3">Seu Diário Alimentar</h2>
      
      <div className="grid gap-5 md:grid-cols-2">
        {logs.map((log) => {
          // ESCUDO DE PROTEÇÃO: Ignora os logs antigos de erro que não têm a lista de "items"
          if (!log.raw_result || !log.raw_result.items) return null;

          // ESCUDO DE PROTEÇÃO 2 (NOVO): Ignora os logs onde a IA retornou "Sistema Indisponível"
          const falhou = log.raw_result.items.some(item => item.name === "Sistema Indisponível");
          if (falhou) return null;

          // Tratamento para garantir que vitalidade é um número
          const vitality = Number(log.raw_result.total_vitality) || 0;

          return (
            <div key={log.id} className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex flex-col justify-between hover:border-brand-500/30 transition-all hover:shadow-xl">
              
              {/* Cabeçalho: Data e Nota de Vitalidade */}
              <div className="flex justify-between items-start mb-5 border-b border-slate-50 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                  vitality >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                  vitality >= 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 
                  'bg-red-500/20 text-red-400 border border-red-500/20'
                }`}>
                  SCORE: {vitality}/100
                </span>
              </div>

              {/* Lista de Alimentos */}
              <div className="mb-5 flex-1">
                <ul className="text-sm text-slate-700 space-y-2">
                  {log.raw_result.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between bg-slate-50 p-2 rounded-lg">
                      <span className="capitalize font-medium">{item.name}</span>
                      <span className="font-bold text-slate-500">{item.calories_est} kcal</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comentário da IA */}
              <div className="mt-auto bg-brand-50 p-3 rounded-xl border border-brand-500/10">
                <p className="text-xs text-brand-900 italic leading-relaxed">
                  "{log.raw_result.recommendation || log.raw_result.comentary}"
                </p>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};