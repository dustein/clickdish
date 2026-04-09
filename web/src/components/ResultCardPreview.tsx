import ClickDishIcon from '../assets/logotipo-v2.webp';
import type { AnalysisResult, AnalysisItem } from './ResultCard';

interface ResultCardPreviewProps {
  imageSrc: string;
  data: AnalysisResult;
}

/**
 * Versão compacta do card para exibição na tela do celular.
 * A recomendação (data.recommendation) é exibida fora deste componente, no App.tsx.
 */
const ResultCardPreview: React.FC<ResultCardPreviewProps> = ({ imageSrc, data }) => {
  const accentDark   = '#2a5640';
  const calColor     = '#2a5640';
  const commentColor = '#334155';
  const scoreColor   = '#22c55e';

  const totalItems = data.items.length;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl border-2 border-white flex flex-col"
      style={{ backgroundColor: '#eef7f3', color: '#1e293b' }}
    >

      {/* HEADER */}
      <div className="w-full pt-4 pb-1 px-4 z-20 text-center">
        <h2 className="text-xl font-extrabold text-[#111827] tracking-tight leading-tight drop-shadow-sm">
          {data.meal_name || 'Análise do Prato'} <img src={ClickDishIcon} alt="ClickDish" className="h-[1.4em] w-auto inline-block align-middle ml-2" />
        </h2>
      </div>

      {/* FOTO */}
      <div className="relative w-full flex items-center justify-center py-4 px-6">
        {/* Fundo desfocado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={imageSrc} className="w-full h-full object-cover blur-3xl opacity-10 saturate-100 scale-125" alt="" />
        </div>

        {/* Círculo da foto */}
        <div className="relative w-[72%] aspect-square z-20">
          <div className="w-full h-full rounded-full overflow-hidden bg-white"
               style={{ border: '3px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
            <img src={imageSrc} className="w-full h-full object-cover" alt="prato" />
          </div>

          {/* SVG linhas */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
            <defs>
              <marker id="arrowheadPreview" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M 0 0 L 5 2.5 L 0 5 z" fill={accentDark} />
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
                    strokeWidth="0.7"
                    fill="none"
                    strokeLinecap="round"
                    markerEnd="url(#arrowheadPreview)"
                  />
                  <circle cx={targetX} cy={targetY} r="1.2" fill={accentDark} />
                  <circle cx={targetX} cy={targetY} r="3" fill="none" stroke={accentDark} strokeWidth="0.3" opacity="0.5" />
                </g>
              );
            })}
          </svg>

          {/* Etiquetas */}
          {data.items.map((item: AnalysisItem, idx: number) => {
            const isLeft = idx % 2 === 0;
            const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
            return (
              <div
                key={`label-${idx}`}
                className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
                style={{ top: `${labelY}%`, [isLeft ? 'right' : 'left']: '85%' }}
              >
                <div
                  className="px-2 py-1 rounded-lg flex flex-col items-center min-w-[65px] max-w-[90px]"
                  style={{
                    backgroundColor: 'rgba(238,247,243,0.95)',
                    border: '1px solid rgba(61,122,92,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: '#1a2e20' }}>
                    {item.name}
                  </span>
                  <span className="text-[8px] font-bold tracking-wide mt-0.5" style={{ color: calColor }}>
                    {item.calories_est} kcal
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RODAPÉ */}
      <div
        className="w-full flex flex-col px-4 pb-4 pt-3 z-20 rounded-b-2xl"
        style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}
      >
        <h3 className="text-[13px] font-medium leading-snug mb-3" style={{ color: commentColor }}>
          "{data.comentary}"
        </h3>

        <div className="flex items-end justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div>
            <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Nível de Saúde</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-black leading-none" style={{ color: scoreColor }}>{data.total_vitality}</span>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
          </div>
          {/* QR Code placeholder */}
          <div className="flex flex-col items-center gap-0.5">
            <svg width="36" height="36" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
              {/* Finder pattern TL */}
              <rect x="0" y="0" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="2" y="2" width="3" height="3" fill="#334155"/>
              {/* Finder pattern TR */}
              <rect x="14" y="0" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="16" y="2" width="3" height="3" fill="#334155"/>
              {/* Finder pattern BL */}
              <rect x="0" y="14" width="7" height="7" fill="none" stroke="#334155" strokeWidth="1"/>
              <rect x="2" y="16" width="3" height="3" fill="#334155"/>
              {/* Data modules (fake pattern) */}
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
            <span className="text-[6px] font-bold text-slate-400 tracking-widest uppercase">ClickDish</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultCardPreview;
