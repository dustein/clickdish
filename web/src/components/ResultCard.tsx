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
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-slate-50 text-slate-900 overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col"
//     >
//       <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-20 flex px-6 pt-6">
//         <h2 className="text-white font-bold text-lg drop-shadow-md">
//           {data.meal_name || "Refeição Analisada"}
//         </h2>
//       </div>

//       <div className="relative w-full h-[60%] overflow-hidden bg-slate-900 rounded-b-3xl shadow-sm">
//         <img 
//           src={imageSrc} 
//           alt="Prato" 
//           className="w-full h-full object-cover"
//           style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }} 
//         />
        
//         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

//         <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
//           {data.items.map((item, idx) => {
//             const yMin = item.box_2d[0] / 10;
//             const xMin = item.box_2d[1] / 10;
//             const yMax = item.box_2d[2] / 10;
//             const xMax = item.box_2d[3] / 10;

//             const targetY = (yMin + yMax) / 2; // Ponto central da comida (alvo)
//             const targetX = (xMin + xMax) / 2;

//             // NOVO: Distribui as etiquetas uniformemente entre 15% e 85% da altura da tela
//             // Evita que as etiquetas se sobreponham, não importa onde a comida esteja
//             const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;
//             const isLeft = idx % 2 === 0;
//             const labelX = isLeft ? 15 : 85; 

//             return (
//               <g key={idx}>
//                 {/* Linha que sai da etiqueta organizada e vai até o alvo da IA */}
//                 <line 
//                   x1={`${labelX}%`} 
//                   y1={`${labelY}%`} 
//                   x2={`${targetX}%`} 
//                   y2={`${targetY}%`} 
//                   stroke="rgba(255, 255, 255, 0.9)" 
//                   strokeWidth="1.5"
//                   strokeDasharray="3 3" 
//                 />
//                 {/* Ponto exato na comida */}
//                 <circle cx={`${targetX}%`} cy={`${targetY}%`} r="3" fill="#fb923c" />
//                 <circle cx={`${targetX}%`} cy={`${targetY}%`} r="8" fill="none" stroke="#fb923c" strokeWidth="2" opacity="0.8" />
//               </g>
//             );
//           })}
//         </svg>

//         {data.items.map((item, idx) => {
//           const isLeft = idx % 2 === 0;
//           // Usa a mesma matemática de distribuição usada na linha do SVG
//           const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;

//           return (
//             <div 
//               key={`label-${idx}`}
//               className={`absolute transform -translate-y-1/2 flex flex-col z-20 ${isLeft ? 'left-[2%]' : 'right-[2%]'}`}
//               style={{ top: `${labelY}%` }}
//             >
//               {/* NOVO: Pílula Escura que garante 100% de leitura do texto em qualquer foto */}
//               <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-xl shadow-2xl flex flex-col items-center min-w-[70px]">
//                 <span className="text-white text-[9px] font-bold uppercase tracking-wider text-center leading-tight mb-0.5">
//                   {item.name}
//                 </span>
//                 <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-black w-full text-center">
//                   {item.calories_est} KCAL
//                 </span>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="flex-1 flex flex-col justify-between p-6">
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex gap-1.5">
//             {extractedColors.map((color, i) => (
//               <div key={i} className={`w-4 h-4 rounded-full ${color} shadow-sm border border-black/5`} />
//             ))}
//           </div>
          
//           <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
//             <Leaf size={14} className="fill-green-600" />
//             <span className="text-xs font-bold tracking-tight uppercase">100% Clean</span>
//           </div>
//         </div>

//         <div>
//           <h3 className="text-xl font-serif text-slate-800 leading-tight tracking-tight mb-2">
//             "{data.comentary}"
//           </h3>
//           <p className="text-xs text-slate-500 font-medium">
//             {data.recommendation}
//           </p>
//         </div>

//         <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Health Score</p>
//             <div className="flex items-baseline gap-1">
//               <span className="text-5xl font-black text-slate-900 leading-none">{data.total_vitality}</span>
//               <span className="text-lg font-bold text-slate-400">/100</span>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-1.5 opacity-50">
//             <Zap size={12} className="fill-slate-400" />
//             <span className="text-[9px] font-bold tracking-widest uppercase">ClickDish AI</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResultCard;












// src/components/ResultCard.tsx
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
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-slate-950 text-slate-100 overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-800 flex flex-col"
//     >
//       {/* =========================================
//           1. HEADER DEDICADO (Isolado e com destaque)
//           ========================================= */}
//       <div className="w-full pt-8 pb-4 px-6 z-20 text-center bg-gradient-to-b from-slate-900 to-transparent">
//         <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-tight drop-shadow-lg">
//           {data.meal_name || "Análise do Prato"}
//         </h2>
//         <div className="h-1 w-16 bg-orange-500 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
//       </div>

//       {/* =========================================
//           2. PALCO DA FOTO (A Mágica da Safe Zone)
//           ========================================= */}
//       <div className="relative flex-1 w-full flex items-center justify-center my-2">
        
//         {/* Fundo Desfocado Imersivo */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <img 
//             src={imageSrc} 
//             className="w-full h-full object-cover blur-3xl opacity-30 saturate-200 scale-125" 
//             alt="bg-blur" 
//           />
//         </div>

//         {/* CONTAINER DA FOTO PRINCIPAL (Apenas 55% da largura, criando as bordas livres) */}
//         <div className="relative w-[55%] aspect-square z-20">
          
//           {/* A Foto do Prato em si (Formato Circular para estética Gourmet) */}
//           <div className="w-full h-full rounded-full border-4 border-slate-700/80 shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
//             <img 
//               src={imageSrc} 
//               className="w-full h-full object-cover" 
//               style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }} 
//               alt="prato"
//             />
//           </div>

//           {/* O Canvas do SVG para desenhar as setas de fora para dentro */}
//           <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
//             {data.items.map((item, idx) => {
//               const yMin = item.box_2d[0] / 10;
//               const xMin = item.box_2d[1] / 10;
//               const yMax = item.box_2d[2] / 10;
//               const xMax = item.box_2d[3] / 10;

//               const targetY = (yMin + yMax) / 2; // Centro do alimento
//               const targetX = (xMin + xMax) / 2;

//               // Distribuição vertical zig-zag para evitar colisão
//               const labelY = totalItems > 1 ? 10 + (idx * (80 / (totalItems - 1))) : 50;
//               const isLeft = idx % 2 === 0;
              
//               // Se é na esquerda, a linha começa fora do eixo X negativo. Se direita, eixo X > 100%.
//               const lineStartX = isLeft ? -15 : 115; 

//               return (
//                 <g key={idx}>
//                   {/* A linha que liga a etiqueta externa à comida */}
//                   <line 
//                     x1={`${lineStartX}%`} 
//                     y1={`${labelY}%`} 
//                     x2={`${targetX}%`} 
//                     y2={`${targetY}%`} 
//                     stroke="rgba(249, 115, 22, 0.8)" // Laranja para destacar
//                     strokeWidth="1.5"
//                     strokeDasharray="4 4" 
//                   />
//                   {/* O "Ponto de Mira" na comida */}
//                   <circle cx={`${targetX}%`} cy={`${targetY}%`} r="4" fill="#fb923c" />
//                   <circle cx={`${targetX}%`} cy={`${targetY}%`} r="10" fill="none" stroke="#fb923c" strokeWidth="1.5" opacity="0.6" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* AS ETIQUETAS HTML FLUTUANDO NAS LATERAIS */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 10 + (idx * (80 / (totalItems - 1))) : 50;

//             return (
//               <div 
//                 key={`label-${idx}`}
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
//                 // O truque: ancoramos a etiqueta do lado de fora da caixa principal
//                 style={{ 
//                   top: `${labelY}%`, 
//                   [isLeft ? 'right' : 'left']: '115%' 
//                 }}
//               >
//                 <div className="bg-slate-900 border border-slate-700/50 px-3 py-1.5 rounded-xl shadow-2xl flex flex-col min-w-[80px] backdrop-blur-md">
//                   <span className={`text-white text-[9px] font-bold uppercase tracking-wider leading-tight mb-1 ${isLeft ? 'text-right' : 'text-left'}`}>
//                     {item.name}
//                   </span>
//                   <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[10px] font-black inline-block text-center border border-orange-500/20">
//                     {item.calories_est} KCAL
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* =========================================
//           3. RODAPÉ (Score e Comentários)
//           ========================================= */}
//       <div className="w-full flex flex-col justify-end p-6 z-20 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex gap-1.5">
//             {extractedColors.map((color, i) => (
//               <div key={i} className={`w-4 h-4 rounded-full ${color} shadow-sm border border-black/20`} />
//             ))}
//           </div>
//           <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">
//             <Leaf size={14} className="fill-green-500" />
//             <span className="text-xs font-bold tracking-tight uppercase">100% Clean</span>
//           </div>
//         </div>

//         <div>
//           <h3 className="text-xl font-serif italic text-slate-200 leading-tight tracking-tight mb-2">
//             "{data.comentary}"
//           </h3>
//           <p className="text-xs text-slate-400 font-medium">
//             {data.recommendation}
//           </p>
//         </div>

//         <div className="mt-5 flex items-end justify-between border-t border-slate-800 pt-5">
//           <div>
//             <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Health Score</p>
//             <div className="flex items-baseline gap-1">
//               <span className="text-5xl font-black text-white leading-none">{data.total_vitality}</span>
//               <span className="text-lg font-bold text-slate-500">/100</span>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-1.5 opacity-50">
//             <Zap size={12} className="fill-slate-500" />
//             <span className="text-[9px] font-bold tracking-widest uppercase">ClickDish AI</span>
//           </div>
//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ResultCard;

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
      className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-[#0f172a] text-slate-100 overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#1e293b] flex flex-col"
    >
      {/* =========================================
          1. HEADER (Título com a linha laranja da sua referência)
          ========================================= */}
      <div className="w-full pt-8 pb-2 px-6 z-20 text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-tight drop-shadow-md">
          {data.meal_name || "Análise do Prato"}
        </h2>
        <div className="h-1.5 w-12 bg-orange-600 mx-auto mt-3 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
      </div>

      {/* =========================================
          2. PALCO DA FOTO (Maior e com Sobreposição)
          ========================================= */}
      <div className="relative flex-1 w-full flex items-center justify-center my-4">
        
        {/* Fundo Imersivo (Apenas para dar o clima dark/gourmet) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img 
            src={imageSrc} 
            className="w-full h-full object-cover blur-3xl opacity-20 saturate-200 scale-125" 
            alt="bg-blur" 
          />
        </div>

        {/* CONTAINER DA FOTO PRINCIPAL (Agora ocupando 75% da largura) */}
        <div className="relative w-[75%] aspect-square z-20">
          
          {/* A Foto Redonda */}
          <div className="w-full h-full rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden bg-black">
            <img 
              src={imageSrc} 
              className="w-full h-full object-cover" 
              style={{ filter: 'contrast(1.1) saturate(1.2) brightness(0.95)' }} 
              alt="prato"
            />
          </div>

          {/* SVG para as linhas e marcações */}
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
              
              // A linha agora nasce exatamente na borda de onde a etiqueta sobrepõe a imagem (15% ou 85%)
              const lineStartX = isLeft ? 15 : 85; 

              return (
                <g key={idx}>
                  <line 
                    x1={`${lineStartX}%`} 
                    y1={`${labelY}%`} 
                    x2={`${targetX}%`} 
                    y2={`${targetY}%`} 
                    stroke="#f97316" // Laranja
                    strokeWidth="1.5"
                    strokeDasharray="4 4" 
                  />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="3" fill="#f97316" />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="8" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
                </g>
              );
            })}
          </svg>

          {/* ETIQUETAS COM SOBREPOSIÇÃO INTELIGENTE */}
          {data.items.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;

            return (
              <div 
                key={`label-${idx}`}
                className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
                // O truque da sobreposição: ancoramos a 85% do lado oposto.
                // Isso faz a etiqueta invadir exatos 15% da imagem, sobrando espaço de sobra nas laterais do card.
                style={{ 
                  top: `${labelY}%`, 
                  [isLeft ? 'right' : 'left']: '85%' 
                }}
              >
                <div className="bg-[#0f172a] border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl flex flex-col min-w-[90px] max-w-[110px]">
                  <span className={`text-white text-[9px] font-bold uppercase tracking-wider leading-tight mb-1 ${isLeft ? 'text-right' : 'text-left'}`}>
                    {item.name}
                  </span>
                  <span className="text-orange-500 text-[10px] font-black tracking-widest text-center">
                    {item.calories_est} KCAL
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================
          3. RODAPÉ (Igual ao seu mockup)
          ========================================= */}
      <div className="w-full flex flex-col justify-end p-6 z-20 bg-[#0f172a]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1.5">
            {extractedColors.map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${color} shadow-sm border border-black/20`} />
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-green-950 text-green-500 px-3 py-1 rounded-full border border-green-800/50">
            <Leaf size={14} className="fill-green-600" />
            <span className="text-xs font-bold tracking-tight uppercase">100% Clean</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-serif italic text-white leading-tight tracking-tight mb-2 drop-shadow-sm">
            "{data.comentary}"
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            {data.recommendation}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-slate-800 pt-5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Health Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-white leading-none">{data.total_vitality}</span>
              <span className="text-lg font-bold text-slate-500">/100</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-50">
            <Zap size={12} className="fill-slate-500" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400">ClickDish AI</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ResultCard;