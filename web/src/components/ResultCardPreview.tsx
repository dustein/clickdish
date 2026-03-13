import React from 'react';
import { Zap, Leaf } from 'lucide-react';
import type { AnalysisResult } from './ResultCard';

interface ResultCardPreviewProps {
  imageSrc: string;
  data: AnalysisResult;
}

/**
 * Versão compacta do card para exibição na tela do celular.
 * Tamanhos de texto e espaçamentos são otimizados para viewports
 * estreitas (300–450 px). A versão de exportação (ResultCard) é
 * usada apenas para gerar a imagem final 1080×1350 px.
 */
const ResultCardPreview: React.FC<ResultCardPreviewProps> = ({ imageSrc, data }) => {
  const extractedColors = ['bg-amber-400', 'bg-orange-600', 'bg-stone-800', 'bg-green-600', 'bg-yellow-100'];
  const totalItems = data.items.length;

  return (
    <div className="relative w-full bg-[#0f172a] text-slate-100 overflow-hidden rounded-2xl shadow-xl border-2 border-[#1e293b] flex flex-col">

      {/* HEADER */}
      <div className="w-full pt-4 pb-1 px-4 z-20 text-center">
        <h2 className="text-xl font-black text-white uppercase tracking-widest leading-tight drop-shadow-md">
          {data.meal_name || 'Análise do Prato'}
        </h2>
        <div className="h-1 w-10 bg-orange-600 mx-auto mt-2 rounded-full" />
      </div>

      {/* FOTO */}
      <div className="relative w-full flex items-center justify-center py-4 px-6">
        {/* Fundo desfocado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={imageSrc} className="w-full h-full object-cover blur-3xl opacity-20 saturate-200 scale-125" alt="" />
        </div>

        {/* Círculo da foto — 72% da largura para a preview */}
        <div className="relative w-[72%] aspect-square z-20">
          <div className="w-full h-full rounded-full border-2 border-white/10 shadow-lg overflow-hidden bg-black">
            <img
              src={imageSrc}
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }}
              alt="prato"
            />
          </div>

          {/* SVG linhas */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
            {data.items.map((item, idx) => {
              const yMin = item.box_2d[0] / 10;
              const xMin = item.box_2d[1] / 10;
              const yMax = item.box_2d[2] / 10;
              const xMax = item.box_2d[3] / 10;
              const targetY = (yMin + yMax) / 2;
              const targetX = (xMin + xMax) / 2;
              const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
              const isLeft = idx % 2 === 0;
              const lineStartX = isLeft ? 15 : 85;
              return (
                <g key={idx}>
                  <line x1={`${lineStartX}%`} y1={`${labelY}%`} x2={`${targetX}%`} y2={`${targetY}%`} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="2.5" fill="#fffb0a" />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="6" fill="none" stroke="#c2c2c2" strokeWidth="1" opacity="0.8" />
                </g>
              );
            })}
          </svg>

          {/* Etiquetas */}
          {data.items.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
            return (
              <div
                key={`label-${idx}`}
                className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
                style={{ top: `${labelY}%`, [isLeft ? 'right' : 'left']: '85%' }}
              >
                <div className="bg-[#0f172a] border border-white/10 px-2 py-1 rounded-lg shadow-xl flex flex-col min-w-[70px] max-w-[90px]">
                  <span className={`text-white text-[8px] font-bold uppercase tracking-wide leading-tight mb-0.5 ${isLeft ? 'text-right' : 'text-left'}`}>
                    {item.name}
                  </span>
                  <span className="text-orange-300 text-[9px] font-black tracking-widest text-center">
                    {item.calories_est} KCAL
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="w-full flex flex-col px-4 pb-4 pt-2 z-20 bg-[#0f172a]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-1.5">
            {extractedColors.map((color, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${color} border border-black/20`} />
            ))}
          </div>
          <div className="flex items-center gap-1 bg-green-950 text-green-500 px-2.5 py-1 rounded-full border border-green-800/50">
            <Leaf size={11} className="fill-green-600" />
            <span className="text-[10px] font-bold tracking-tight uppercase">100% Clean</span>
          </div>
        </div>

        <h3 className="text-sm font-serif italic text-white leading-snug mb-1">
          "{data.comentary}"
        </h3>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3">
          {data.recommendation}
        </p>

        <div className="flex items-end justify-between border-t border-slate-800 pt-3">
          <div>
            <p className="text-[8px] font-bold text-slate-500 tracking-widest uppercase mb-0.5">Health Score</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black text-white leading-none">{data.total_vitality}</span>
              <span className="text-sm font-bold text-slate-500">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-50">
            <Zap size={10} className="fill-slate-500" />
            <span className="text-[8px] font-bold tracking-widest uppercase text-slate-400">ClickDish AI</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultCardPreview;
