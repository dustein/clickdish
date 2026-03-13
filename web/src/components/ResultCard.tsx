import React from 'react';
import { Zap, Leaf } from 'lucide-react';

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
  const extractedColors = ['bg-amber-400', 'bg-orange-600', 'bg-stone-800', 'bg-green-600', 'bg-yellow-100'];
  const totalItems = data.items.length;

  return (
    <div
      id={id}
      // Tamanho 100% do container pai — no app usa o wrapper aspect-[4/5], na exportação usa o container 1080×1350
      className="relative w-full h-full bg-[#0f172a] text-slate-100 overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#1e293b] flex flex-col"
    >
      {/* =========================================
          1. HEADER
          ========================================= */}
      <div className="w-full pt-8 pb-2 px-12 z-20 text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-widest leading-tight drop-shadow-md">
          {data.meal_name || 'Análise do Prato'}
        </h2>
        <div className="h-1.5 w-16 bg-orange-600 mx-auto mt-3 rounded-full shadow-[0_0_12px_rgba(234,88,12,0.6)]" />
      </div>

      {/* =========================================
          2. PALCO DA FOTO
          ========================================= */}
      <div className="relative flex-1 w-full flex items-center justify-center my-4">

        {/* Fundo imersivo desfocado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={imageSrc}
            className="w-full h-full object-cover blur-3xl opacity-20 saturate-200 scale-125"
            alt="bg-blur"
          />
        </div>

        {/* Foto principal — 65% da largura dá 702 px de círculo a 1080 px.
            Com flex-1 a seção expande/retrai, garantindo que o footer
            nunca seja cortado independente do tamanho do título. */}
        <div className="relative w-[65%] aspect-square z-20">

          {/* Foto redonda */}
          <div className="w-full h-full rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden bg-black">
            <img
              src={imageSrc}
              className="w-full h-full object-cover"
              style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }}
              alt="prato"
            />
          </div>

          {/* SVG — linhas e marcadores */}
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
                  <line
                    x1={`${lineStartX}%`}
                    y1={`${labelY}%`}
                    x2={`${targetX}%`}
                    y2={`${targetY}%`}
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="5" fill="#fffb0a" />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="12" fill="none" stroke="#c2c2c2" strokeWidth="2" opacity="0.8" />
                </g>
              );
            })}
          </svg>

          {/* Etiquetas com sobreposição */}
          {data.items.map((item, idx) => {
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
                <div className="bg-[#0f172a] border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col min-w-[150px] max-w-[190px]">
                  <span className={`text-white text-[16px] font-bold uppercase tracking-wider leading-tight mb-1.5 ${isLeft ? 'text-right' : 'text-left'}`}>
                    {item.name}
                  </span>
                  <span className="text-orange-300 text-[18px] font-black tracking-widest text-center">
                    {item.calories_est} KCAL
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
      <div className="w-full flex flex-col justify-end px-12 pb-7 pt-3 z-20 bg-[#0f172a]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-3">
            {extractedColors.map((color, i) => (
              <div key={i} className={`w-5 h-5 rounded-full ${color} shadow-sm border border-black/20`} />
            ))}
          </div>
          <div className="flex items-center gap-2 bg-green-950 text-green-400 px-4 py-1.5 rounded-full border border-green-800/50">
            <Leaf size={18} className="fill-green-500" />
            <span className="text-sm font-bold tracking-tight uppercase">100% Clean</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-serif italic text-white leading-snug tracking-tight mb-2 drop-shadow-sm">
            "{data.comentary}"
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {data.recommendation}
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-slate-800 pt-4">
          <div>
            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">Health Score</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-white leading-none">{data.total_vitality}</span>
              <span className="text-xl font-bold text-slate-500">/100</span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-50">
            <Zap size={16} className="fill-slate-500" />
            <span className="text-sm font-bold tracking-widest uppercase text-slate-400">ClickDish AI</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResultCard;

// import React from 'react';
// import { Zap, Leaf } from 'lucide-react';

// export interface AnalysisItem {
//   name: string;
//   calories_est: number;
//   health_score: number;
//   box_2d: [number, number, number, number];
// }

// export interface AnalysisResult {
//   items: AnalysisItem[];
//   total_vitality: number;
//   recommendation: string;
//   comentary: string;
//   meal_name?: string;
// }

// interface ResultCardProps {
//   imageSrc: string;
//   data: AnalysisResult;
//   id?: string;
// }

// const ResultCard: React.FC<ResultCardProps> = ({ imageSrc, data, id }) => {
//   const extractedColors = ['bg-amber-400', 'bg-orange-600', 'bg-stone-800', 'bg-green-600', 'bg-yellow-100'];
//   const totalItems = data.items.length;

//   return (
//     <div
//       id={id}
//       // Tamanho 100% do container pai — no app usa o wrapper aspect-[4/5], na exportação usa o container 1080×1350
//       className="relative w-full h-full bg-[#0f172a] text-slate-100 overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#1e293b] flex flex-col"
//     >
//       {/* =========================================
//           1. HEADER
//           ========================================= */}
//       <div className="w-full pt-10 pb-3 px-12 z-20 text-center">
//         <h2 className="text-5xl font-black text-white uppercase tracking-widest leading-tight drop-shadow-md">
//           {data.meal_name || 'Análise do Prato'}
//         </h2>
//         <div className="h-2 w-20 bg-orange-600 mx-auto mt-4 rounded-full shadow-[0_0_14px_rgba(234,88,12,0.6)]" />
//       </div>

//       {/* =========================================
//           2. PALCO DA FOTO
//           ========================================= */}
//       <div className="relative flex-1 w-full flex items-center justify-center my-4">

//         {/* Fundo imersivo desfocado */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <img
//             src={imageSrc}
//             className="w-full h-full object-cover blur-3xl opacity-20 saturate-200 scale-125"
//             alt="bg-blur"
//           />
//         </div>

//         {/* Foto principal — 78% da largura, deixa ~11% de margem para as etiquetas em cada lado */}
//         <div className="relative w-[78%] aspect-square z-20">

//           {/* Foto redonda */}
//           <div className="w-full h-full rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden bg-black">
//             <img
//               src={imageSrc}
//               className="w-full h-full object-cover"
//               style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }}
//               alt="prato"
//             />
//           </div>

//           {/* SVG — linhas e marcadores */}
//           <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
//             {data.items.map((item, idx) => {
//               const yMin = item.box_2d[0] / 10;
//               const xMin = item.box_2d[1] / 10;
//               const yMax = item.box_2d[2] / 10;
//               const xMax = item.box_2d[3] / 10;

//               const targetY = (yMin + yMax) / 2;
//               const targetX = (xMin + xMax) / 2;
//               const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
//               const isLeft = idx % 2 === 0;
//               const lineStartX = isLeft ? 15 : 85;

//               return (
//                 <g key={idx}>
//                   <line
//                     x1={`${lineStartX}%`}
//                     y1={`${labelY}%`}
//                     x2={`${targetX}%`}
//                     y2={`${targetY}%`}
//                     stroke="#ffffff"
//                     strokeWidth="3"
//                     strokeDasharray="6 5"
//                   />
//                   <circle cx={`${targetX}%`} cy={`${targetY}%`} r="5" fill="#fffb0a" />
//                   <circle cx={`${targetX}%`} cy={`${targetY}%`} r="12" fill="none" stroke="#c2c2c2" strokeWidth="2" opacity="0.8" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* Etiquetas com sobreposição */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;

//             return (
//               <div
//                 key={`label-${idx}`}
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
//                 style={{
//                   top: `${labelY}%`,
//                   [isLeft ? 'right' : 'left']: '85%',
//                 }}
//               >
//                 <div className="bg-[#0f172a] border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col min-w-[150px] max-w-[190px]">
//                   <span className={`text-white text-[16px] font-bold uppercase tracking-wider leading-tight mb-1.5 ${isLeft ? 'text-right' : 'text-left'}`}>
//                     {item.name}
//                   </span>
//                   <span className="text-orange-300 text-[18px] font-black tracking-widest text-center">
//                     {item.calories_est} KCAL
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* =========================================
//           3. RODAPÉ
//           ========================================= */}
//       <div className="w-full flex flex-col justify-end px-12 pb-8 pt-4 z-20 bg-[#0f172a]">
//         <div className="flex justify-between items-center mb-5">
//           <div className="flex gap-3">
//             {extractedColors.map((color, i) => (
//               <div key={i} className={`w-6 h-6 rounded-full ${color} shadow-sm border border-black/20`} />
//             ))}
//           </div>
//           <div className="flex items-center gap-2 bg-green-950 text-green-400 px-5 py-2 rounded-full border border-green-800/50">
//             <Leaf size={20} className="fill-green-500" />
//             <span className="text-base font-bold tracking-tight uppercase">100% Clean</span>
//           </div>
//         </div>

//         <div>
//           <h3 className="text-2xl font-serif italic text-white leading-snug tracking-tight mb-2 drop-shadow-sm">
//             "{data.comentary}"
//           </h3>
//           <p className="text-sm text-slate-400 font-medium leading-relaxed">
//             {data.recommendation}
//           </p>
//         </div>

//         <div className="mt-4 flex items-end justify-between border-t border-slate-800 pt-4">
//           <div>
//             <p className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-1">Health Score</p>
//             <div className="flex items-baseline gap-2">
//               <span className="text-6xl font-black text-white leading-none">{data.total_vitality}</span>
//               <span className="text-2xl font-bold text-slate-500">/100</span>
//             </div>
//           </div>

//           <div className="flex items-center gap-2 opacity-50">
//             <Zap size={18} className="fill-slate-500" />
//             <span className="text-sm font-bold tracking-widest uppercase text-slate-400">ClickDish AI</span>
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// };

// export default ResultCard;