import React from 'react';
import { darken } from '../lib/colorExtractor';
import ClickDishIcon from '../assets/logotipo-v2.webp';

export interface AnalysisItem {
  name: string;
  calories_est: number;
  health_score: number;
  box_2d: [number, number, number, number];
}

export interface AnalysisResult {
  items: AnalysisItem[];
  total_vitality: number;
  recommendation: string;
  comentary: string;
  meal_name?: string;
}

interface ResultCardProps {
  imageSrc: string;
  data: AnalysisResult;
  id?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ imageSrc, data, id }) => {
  const accentColor  = '#3d7a5c';
  const accentDark   = darken(accentColor, 0.35);
  const calColor     = '#2a5640';
  const commentColor = '#334155';
  const scoreColor   = '#22c55e';

  const labelBg     = 'rgba(238,247,243,0.95)';
  const labelBorder = 'rgba(61,122,92,0.2)';

  const totalItems = data.items.length;

  return (
    <div
      id={id}
      className="relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white flex flex-col"
      style={{ backgroundColor: '#eef7f3', color: '#1e293b' }}
    >
      {/* =========================================
          1. HEADER
          ========================================= */}
      <div className="w-full pt-6 pb-1 px-10 z-20 text-center">
        <h2 className="text-5xl font-extrabold text-[#111827] tracking-tight leading-tight drop-shadow-sm">
          {data.meal_name || 'Análise do Prato'} <img src={ClickDishIcon} alt="ClickDish" className="h-[1.4em] w-auto inline-block align-middle ml-2" />
        </h2>
      </div>

      {/* =========================================
          2. PALCO DA FOTO
          ========================================= */}
      <div className="relative flex-1 w-full flex items-center justify-center my-1">

        {/* Fundo imersivo desfocado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={imageSrc}
            className="w-full h-full object-cover blur-3xl opacity-10 saturate-100 scale-125"
            style={{ mixBlendMode: 'multiply' }}
            alt="bg-blur"
          />
        </div>

        {/* Foto principal */}
        <div className="relative w-[80%] aspect-square z-20">

          {/* Foto redonda */}
          <div className="w-full h-full rounded-full overflow-hidden bg-white"
               style={{ border: '6px solid white', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            <img
              src={imageSrc}
              className="w-full h-full object-cover"
              alt="prato"
            />
          </div>

          {/* SVG — linhas e marcadores */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
            <defs>
              <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
                <path d={`M 0 0 L 4 2 L 0 4 z`} fill={accentDark} />
              </marker>
            </defs>
            {data.items.map((item: AnalysisItem, idx: number) => {
              const yMin = item.box_2d[0] / 10;
              const xMin = item.box_2d[1] / 10;
              const yMax = item.box_2d[2] / 10;
              const xMax = item.box_2d[3] / 10;

              const targetY = (yMin + yMax) / 2;
              const targetX = (xMin + xMax) / 2;
              const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
              const isLeft = idx % 2 === 0;
              const lineStartX = isLeft ? 15 : 85;

              const cp1X = lineStartX + (targetX - lineStartX) * 0.4;
              const cp1Y = labelY;
              const cp2X = lineStartX + (targetX - lineStartX) * 0.6;
              const cp2Y = targetY;

              return (
                <g key={idx}>
                  <path
                    d={`M ${lineStartX} ${labelY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`}
                    stroke={accentDark}
                    strokeWidth="0.6"
                    fill="none"
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle cx={targetX} cy={targetY} r="1" fill={accentDark} />
                  <circle cx={targetX} cy={targetY} r="2.2" fill="none" stroke={accentDark} strokeWidth="0.25" opacity="0.5" />
                </g>
              );
            })}
          </svg>

          {/* Etiquetas com sobreposição */}
          {data.items.map((item: AnalysisItem, idx: number) => {
            const isLeft = idx % 2 === 0;
            const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;

            return (
              <div
                key={`label-${idx}`}
                className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
                style={{
                  top: `${labelY}%`,
                  [isLeft ? 'right' : 'left']: '85%',
                }}
              >
                <div
                  className="px-5 py-3 rounded-xl flex flex-col items-center min-w-[140px] max-w-[200px]"
                  style={{
                    backgroundColor: labelBg,
                    border: `1px solid ${labelBorder}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  <span className="text-[22px] font-semibold leading-tight text-center" style={{ color: '#1a2e20' }}>
                    {item.name}
                  </span>
                  <span className="text-[17px] font-bold tracking-wide mt-1" style={{ color: calColor }}>
                    {item.calories_est} kcal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================
          3. RODAPÉ
          ========================================= */}
      <div
        className="w-full flex flex-col justify-end px-12 pb-6 pt-4 z-20 rounded-b-[2.5rem]"
        style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}
      >
        <div>
          <h3 className="text-2xl font-medium leading-snug tracking-tight mb-2" style={{ color: commentColor }}>
            "{data.comentary}"
          </h3>
        </div>

        <div className="mt-3 flex items-end justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div>
            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-1">Nível de Saúde</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-6xl font-black leading-none" style={{ color: scoreColor }}>{data.total_vitality}</span>
              <span className="text-2xl font-bold text-slate-400">/100</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            {/* QR Code placeholder — substituir pelo QR real do site ClickDish */}
            <svg width="60" height="60" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
              <rect x="0" y="0" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="2" y="2" width="3" height="3" fill="#334155"/>
              <rect x="14" y="0" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="16" y="2" width="3" height="3" fill="#334155"/>
              <rect x="0" y="14" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="2" y="16" width="3" height="3" fill="#334155"/>
              <rect x="8" y="0" width="1" height="1" fill="#334155"/>
              <rect x="10" y="0" width="1" height="1" fill="#334155"/>
              <rect x="12" y="0" width="1" height="1" fill="#334155"/>
              <rect x="8" y="2" width="1" height="1" fill="#334155"/>
              <rect x="11" y="2" width="1" height="1" fill="#334155"/>
              <rect x="8" y="4" width="2" height="1" fill="#334155"/>
              <rect x="12" y="4" width="1" height="1" fill="#334155"/>
              <rect x="9" y="6" width="1" height="1" fill="#334155"/>
              <rect x="11" y="6" width="2" height="1" fill="#334155"/>
              <rect x="0" y="8" width="1" height="1" fill="#334155"/>
              <rect x="2" y="8" width="2" height="1" fill="#334155"/>
              <rect x="6" y="8" width="1" height="1" fill="#334155"/>
              <rect x="8" y="8" width="1" height="1" fill="#334155"/>
              <rect x="10" y="8" width="3" height="1" fill="#334155"/>
              <rect x="14" y="8" width="1" height="1" fill="#334155"/>
              <rect x="16" y="8" width="2" height="1" fill="#334155"/>
              <rect x="20" y="8" width="1" height="1" fill="#334155"/>
              <rect x="1" y="10" width="1" height="1" fill="#334155"/>
              <rect x="4" y="10" width="1" height="1" fill="#334155"/>
              <rect x="7" y="10" width="2" height="1" fill="#334155"/>
              <rect x="11" y="10" width="1" height="1" fill="#334155"/>
              <rect x="13" y="10" width="2" height="1" fill="#334155"/>
              <rect x="17" y="10" width="1" height="1" fill="#334155"/>
              <rect x="19" y="10" width="2" height="1" fill="#334155"/>
              <rect x="0" y="12" width="2" height="1" fill="#334155"/>
              <rect x="4" y="12" width="1" height="1" fill="#334155"/>
              <rect x="8" y="12" width="1" height="1" fill="#334155"/>
              <rect x="10" y="12" width="2" height="1" fill="#334155"/>
              <rect x="14" y="12" width="1" height="1" fill="#334155"/>
              <rect x="16" y="12" width="3" height="1" fill="#334155"/>
              <rect x="8" y="14" width="1" height="1" fill="#334155"/>
              <rect x="10" y="14" width="1" height="1" fill="#334155"/>
              <rect x="12" y="14" width="2" height="1" fill="#334155"/>
              <rect x="8" y="16" width="2" height="1" fill="#334155"/>
              <rect x="12" y="16" width="1" height="1" fill="#334155"/>
              <rect x="15" y="16" width="2" height="1" fill="#334155"/>
              <rect x="8" y="18" width="1" height="1" fill="#334155"/>
              <rect x="11" y="18" width="1" height="1" fill="#334155"/>
              <rect x="13" y="18" width="3" height="1" fill="#334155"/>
              <rect x="8" y="20" width="2" height="1" fill="#334155"/>
              <rect x="12" y="20" width="1" height="1" fill="#334155"/>
              <rect x="14" y="20" width="2" height="1" fill="#334155"/>
              <rect x="18" y="20" width="2" height="1" fill="#334155"/>
            </svg>
            <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">ClickDish</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultCard;