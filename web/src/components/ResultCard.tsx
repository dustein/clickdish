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
                    stroke="#ffffff" // Laranja
                    strokeWidth="2.5"
                    strokeDasharray="4 4" 
                  />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="3" fill="#fffb0a" />
                  <circle cx={`${targetX}%`} cy={`${targetY}%`} r="8" fill="none" stroke="#c2c2c2" strokeWidth="1.5" opacity="0.8" />
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
                  <span className="text-orange-300 text-[10px] font-black tracking-widest text-center">
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





// import React from 'react';
// import { Zap, Leaf, Sparkles } from 'lucide-react';

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
//   const extractedColors = ['bg-orange-400', 'bg-amber-300', 'bg-red-400', 'bg-green-400', 'bg-yellow-200'];
//   const totalItems = data.items.length;

//   return (
//     <div 
//       id={id}
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 text-slate-800 overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(249,115,22,0.15)] border-4 border-white flex flex-col font-sans"
//     >
//       {/* =========================================
//           1. HEADER (Claro e Ensolarado)
//           ========================================= */}
//       <div className="w-full pt-8 pb-4 px-6 z-20 text-center relative">
//         <Sparkles className="absolute top-6 left-6 text-orange-300 opacity-50" size={24} />
//         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest leading-tight">
//           {data.meal_name || "Análise do Prato"}
//         </h2>
//         <div className="h-1.5 w-16 bg-gradient-to-r from-orange-400 to-amber-400 mx-auto mt-3 rounded-full shadow-sm" />
//       </div>

//       {/* =========================================
//           2. PALCO DA FOTO (Estilo "Adesivo" e Bouncy)
//           ========================================= */}
//       <div className="relative flex-1 w-full flex items-center justify-center my-2">
        
//         {/* Fundo Desfocado Leve (Dá destaque à foto central) */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-30">
//           <div className="w-64 h-64 bg-orange-400 rounded-full blur-[80px]"></div>
//         </div>

//         {/* Container Principal da Foto (75% da largura) */}
//         <div className="relative w-[75%] aspect-square z-20">
          
//           {/* A Foto Redonda com Moldura Branca Grossa (Estilo Prato) */}
//           <div className="w-full h-full rounded-full border-8 border-white shadow-[0_15px_35px_rgba(249,115,22,0.2)] overflow-hidden bg-white">
//             <img 
//               src={imageSrc} 
//               className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105" 
//               style={{ filter: 'contrast(1.05) saturate(1.2) brightness(1.02)' }} 
//               alt="prato"
//             />
//           </div>

//           {/* SVG DAS SETAS (Coloridas, tracejadas e alegres) */}
//           <svg 
//             className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
//             viewBox="0 0 100 100"
//             preserveAspectRatio="none"
//           >
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

//               // Curva suave e "gordinha"
//               const controlX = lineStartX + (isLeft ? 10 : -10);
//               const controlY = targetY < labelY ? targetY - 20 : labelY - 20;

//               return (
//                 <g key={idx}>
//                   {/* Linha Curva Tracejada (Estilo Rota Animada) */}
//                   <path 
//                     d={`M ${lineStartX} ${labelY} Q ${controlX} ${controlY} ${targetX} ${targetY}`}
//                     stroke="#f97316" // Laranja forte
//                     strokeWidth="2.5" 
//                     fill="none"
//                     strokeLinecap="round" 
//                     strokeDasharray="1 6" // Cria bolinhas no rastro
//                   />
//                   {/* O "Alvo" no alimento */}
//                   <circle cx={targetX} cy={targetY} r="4" fill="#f97316" className="animate-pulse" />
//                   <circle cx={targetX} cy={targetY} r="9" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.4" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* ETIQUETAS FLUTUANTES (Estilo Bolhas/Pills) */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 15 + (idx * (70 / (totalItems - 1))) : 50;

//             return (
//               <div 
//                 key={`label-${idx}`}
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
//                 style={{ 
//                   top: `${labelY}%`, 
//                   [isLeft ? 'right' : 'left']: '85%' 
//                 }}
//               >
//                 {/* Etiqueta Branca com Sombra Suave */}
//                 <div className="bg-white border-2 border-orange-100 px-3 py-2 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] flex flex-col items-center min-w-[90px] max-w-[110px]">
//                   <span className="text-slate-700 text-[9.5px] font-extrabold uppercase tracking-wide leading-tight mb-1 text-center">
//                     {item.name}
//                   </span>
//                   {/* Pílula Interna para Calorias */}
//                   <span className="bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest text-center">
//                     {item.calories_est} KCAL
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* =========================================
//           3. RODAPÉ (Caixa Branca Integrada)
//           ========================================= */}
//       <div className="w-full flex flex-col justify-end p-6 z-20 bg-white/60 backdrop-blur-xl rounded-t-[2.5rem] mt-4 border-t border-white/80 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        
//         {/* Paleta e Selo 100% Clean */}
//         <div className="flex justify-between items-center mb-5">
//           <div className="flex gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
//             {extractedColors.map((color, i) => (
//               <div key={i} className={`w-3.5 h-3.5 rounded-full ${color} shadow-inner`} />
//             ))}
//           </div>
          
//           <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
//             <Leaf size={14} className="fill-green-500 text-green-500 animate-bounce" style={{ animationDuration: '2s' }} />
//             <span className="text-xs font-bold tracking-tight uppercase text-green-700">100% Clean</span>
//           </div>
//         </div>

//         {/* Caixa de Comentário */}
//         <div className="mb-4 px-2">
//           <h3 className="text-xl font-serif italic text-slate-800 leading-tight tracking-tight mb-2">
//             "{data.comentary}"
//           </h3>
//           <p className="text-xs text-slate-500 font-medium leading-relaxed">
//             {data.recommendation}
//           </p>
//         </div>

//         {/* Score Final */}
//         <div className="flex items-end justify-between border-t border-orange-100 pt-4 px-2">
//           <div>
//             <p className="text-[10px] font-bold text-orange-400 tracking-widest uppercase mb-1">Health Score</p>
//             <div className="flex items-baseline gap-1">
//               <span className="text-5xl font-black text-slate-800 leading-none tracking-tighter">{data.total_vitality}</span>
//               <span className="text-sm font-bold text-slate-400">/100</span>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
//             <Zap size={14} className="fill-orange-400 text-orange-400" />
//             <span className="text-[10px] font-black tracking-widest uppercase text-orange-400">ClickDish</span>
//           </div>
//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ResultCard;






// import React from 'react';
// import { Zap, Leaf, HeartPulse, Sparkles } from 'lucide-react';

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
//   const totalItems = data.items.length;

//   return (
//     <div 
//       id={id}
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-gradient-to-b from-slate-50 to-slate-200 text-slate-800 overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col font-sans"
//     >
//       {/* =========================================
//           1. HEADER (Limpo e Elegante)
//           ========================================= */}
//       <div className="w-full pt-8 pb-2 px-6 z-20 text-center relative">
//         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">
//           {data.meal_name || "Análise do Prato"}
//         </h2>
//         <div className="h-1 w-12 bg-slate-300 mx-auto mt-3 rounded-full" />
//       </div>

//       {/* =========================================
//           2. PALCO DA FOTO E SETAS (Estilo Infográfico)
//           ========================================= */}
//       <div className="relative flex-1 w-full flex items-center justify-center mt-2 mb-4">
        
//         {/* Container da Foto Principal (70% da largura) */}
//         <div className="relative w-[70%] aspect-square z-20">
          
//           {/* A Foto com Borda Branca Grossa e Sombra Suave (Efeito Flutuante) */}
//           <div className="w-full h-full rounded-3xl border-8 border-white shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
//             <img 
//               src={imageSrc} 
//               className="w-full h-full object-cover" 
//               style={{ filter: 'contrast(1.05) saturate(1.1) brightness(1.02)' }} 
//               alt="prato"
//             />
//           </div>

//           {/* SVG DAS SETAS (Elegantes e finas como na referência) */}
//           <svg 
//             className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
//             viewBox="0 0 100 100"
//             preserveAspectRatio="none"
//           >
//             <defs>
//               <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4">
//                 <circle cx="5" cy="5" r="5" fill="#64748b" />
//               </marker>
//             </defs>

//             {data.items.map((item, idx) => {
//               const yMin = item.box_2d[0] / 10;
//               const xMin = item.box_2d[1] / 10;
//               const yMax = item.box_2d[2] / 10;
//               const xMax = item.box_2d[3] / 10;

//               const targetY = (yMin + yMax) / 2;
//               const targetX = (xMin + xMax) / 2;

//               const labelY = totalItems > 1 ? 10 + (idx * (80 / (totalItems - 1))) : 50;
//               const isLeft = idx % 2 === 0;
              
//               // Nasce perto da borda do card de texto
//               const lineStartX = isLeft ? 5 : 95; 

//               // Curvas suaves (Bézier) apontando para o centro do alimento
//               const controlX = lineStartX + (isLeft ? 20 : -20);
//               const controlY = labelY; 

//               return (
//                 <g key={idx}>
//                   {/* Linha Fina Cinza */}
//                   <path 
//                     d={`M ${lineStartX} ${labelY} C ${controlX} ${controlY}, ${(lineStartX + targetX)/2} ${targetY}, ${targetX} ${targetY}`}
//                     stroke="#94a3b8" 
//                     strokeWidth="0.8" 
//                     fill="none"
//                     strokeLinecap="round" 
//                   />
//                   {/* O "Ponto/Alvo" no alimento */}
//                   <circle cx={targetX} cy={targetY} r="2.5" fill="#f97316" />
//                   <circle cx={targetX} cy={targetY} r="6" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.4" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* ETIQUETAS (Brancas, cantos arredondados, texto escuro) */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 10 + (idx * (80 / (totalItems - 1))) : 50;

//             return (
//               <div 
//                 key={`label-${idx}`}
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${isLeft ? 'items-end' : 'items-start'}`}
//                 style={{ 
//                   top: `${labelY}%`, 
//                   [isLeft ? 'right' : 'left']: '95%' 
//                 }}
//               >
//                 {/* O Design do Cartão estilo Apple/Moderno */}
//                 <div className="bg-white/95 backdrop-blur-md border border-white px-3 py-2 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.06)] flex flex-col items-center min-w-[90px] max-w-[120px]">
//                   <span className="text-slate-800 text-[10px] font-bold uppercase tracking-wide leading-tight mb-1 text-center">
//                     {item.name}
//                   </span>
//                   <span className="text-slate-500 text-[9px] font-semibold text-center">
//                     {item.calories_est} kcal
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* =========================================
//           3. RODAPÉ (Comentário + Badges Coloridas)
//           ========================================= */}
//       <div className="w-full flex flex-col justify-end px-6 pb-6 pt-2 z-20">
        
//         {/* Caixa de Comentário e Dica */}
//         <div className="bg-white/60 backdrop-blur-sm border border-white p-4 rounded-3xl shadow-sm mb-4">
//           <h3 className="text-lg font-serif italic text-slate-800 leading-tight tracking-tight mb-2">
//             "{data.comentary}"
//           </h3>
//           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
//             <Sparkles size={12} className="inline text-amber-500 mr-1" />
//             {data.recommendation}
//           </p>
//         </div>

//         {/* =========================================
//             BADGES INSPIRADAS NA SUA IMAGEM
//             ========================================= */}
//         <div className="flex flex-wrap gap-2 justify-center">
          
//           {/* Badge 1: Health Score (Vermelho/Rosa) */}
//           <div className="flex items-center bg-white border border-slate-100 rounded-full pr-3 p-1 shadow-sm">
//             <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
//               <HeartPulse size={12} className="text-red-500" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Score</span>
//               <span className="text-[11px] font-black text-slate-700 leading-none">{data.total_vitality}/100</span>
//             </div>
//           </div>

//           {/* Badge 2: Status (Verde) */}
//           <div className="flex items-center bg-white border border-slate-100 rounded-full pr-3 p-1 shadow-sm">
//             <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
//               <Leaf size={12} className="text-green-500" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Status</span>
//               <span className="text-[11px] font-black text-slate-700 leading-none">100% Clean</span>
//             </div>
//           </div>

//           {/* Badge 3: IA (Azul) */}
//           <div className="flex items-center bg-white border border-slate-100 rounded-full pr-3 p-1 shadow-sm">
//             <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
//               <Zap size={12} className="text-blue-500" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Powered By</span>
//               <span className="text-[11px] font-black text-slate-700 leading-none">ClickDish AI</span>
//             </div>
//           </div>

//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ResultCard;





// import React from 'react';
// import { Leaf, HeartPulse, Sparkles, Zap } from 'lucide-react';
// import { type extractedPalette } from '../lib/colors';

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
//   colors?: extractedPalette | null;
// }

// const ResultCard: React.FC<ResultCardProps> = ({ imageSrc, data, id, colors }) => {
//   const totalItems = data.items.length;

//   // Fallback seguro caso as cores ainda não tenham sido extraídas
//   const safeColors = colors || {
//     dominant: '#f97316',
//     palette: ['#f97316', '#fbbf24', '#f87171', '#34d399', '#60a5fa'],
//     bgGradient: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)'
//   };

//   const primaryColor = safeColors.dominant;

//   return (
//     <div 
//       id={id}
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white flex flex-col font-sans transition-all duration-700"
//       style={{ background: safeColors.bgGradient }} 
//     >
//       {/* =========================================
//           1. HEADER
//           ========================================= */}
//       <div className="w-full pt-8 pb-3 px-6 z-20 text-center relative">
//         <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight mix-blend-color-burn drop-shadow-sm">
//           {data.meal_name || "Análise do Prato"}
//         </h2>
//         <div 
//           className="h-1.5 w-12 mx-auto mt-2.5 rounded-full opacity-70" 
//           style={{ backgroundColor: primaryColor }}
//         />
//       </div>

//       {/* =========================================
//           2. ÁREA DA FOTO (Nem 8, Nem 80)
//           ========================================= */}
//       <div className="relative flex-1 w-full flex flex-col justify-center px-4 z-20">
        
//         {/* Container da foto ocupa 60%, deixando espaço lateral para as etiquetas */}
//         <div className="relative w-[60%] mx-auto aspect-square z-20">
          
//           {/* Imagem do Prato com Borda */}
//           <div 
//             className="w-full h-full rounded-[2rem] border-[5px] border-white/80 overflow-hidden shadow-xl"
//             style={{ boxShadow: `0 15px 35px -10px ${primaryColor}60` }} 
//           >
//             <img 
//               src={imageSrc} 
//               className="w-full h-full object-cover scale-105" 
//               style={{ filter: 'contrast(1.05) saturate(1.1)' }} 
//               alt="prato"
//             />
//           </div>

//           {/* SVG Das Linhas-Guia (Pode transbordar a foto para conectar nas etiquetas) */}
//           <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10" viewBox="0 0 100 100">
//             {data.items.map((item, idx) => {
//               const yMin = item.box_2d[0] / 10;
//               const xMin = item.box_2d[1] / 10;
//               const yMax = item.box_2d[2] / 10;
//               const xMax = item.box_2d[3] / 10;

//               const targetY = (yMin + yMax) / 2;
//               const targetX = (xMin + xMax) / 2;

//               const isLeft = idx % 2 === 0;
//               const labelY = totalItems > 1 ? 15 + (idx * (70 / Math.max(1, totalItems - 1))) : 50;
              
//               // A linha nasce no centro exato da borda (0 para esquerda, 100 para direita)
//               const lineStartX = isLeft ? 0 : 100; 

//               return (
//                 <g key={idx}>
//                   <line 
//                     x1={lineStartX} 
//                     y1={labelY} 
//                     x2={targetX} 
//                     y2={targetY} 
//                     stroke="white" 
//                     strokeWidth="1.5" 
//                     strokeDasharray="2 3"
//                     opacity="0.9"
//                     style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))' }}
//                   />
//                   <circle cx={targetX} cy={targetY} r="3" fill={primaryColor} stroke="white" strokeWidth="1.5" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* ETIQUETAS "MEIO A MEIO" */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 15 + (idx * (70 / Math.max(1, totalItems - 1))) : 50;

//             return (
//               <div 
//                 key={`label-${idx}`}
//                 // Aqui está a mágica: ancoramos na borda (left-0 ou right-0) 
//                 // e transladamos 50% do próprio tamanho para fora!
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${
//                   isLeft ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2'
//                 }`}
//                 style={{ top: `${labelY}%` }}
//               >
//                 {/* O Design Translúcido da Etiqueta */}
//                 <div className="bg-white/70 backdrop-blur-md border border-white px-2.5 py-2 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center min-w-[85px] max-w-[100px] transition-transform hover:scale-105">
//                   <span className="text-slate-800 text-[9px] font-extrabold uppercase tracking-wide leading-none mb-1 text-center">
//                     {item.name}
//                   </span>
//                   <span 
//                     className="font-black text-[12px] text-center"
//                     style={{ color: primaryColor }}
//                   >
//                     {item.calories_est} <span className="text-[8px] font-bold opacity-70">kcal</span>
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
//       <div className="w-full flex flex-col justify-end px-6 pb-8 pt-3 z-20">
        
//         {/* Caixa de Comentário */}
//         <div className="bg-white/50 backdrop-blur-md border border-white p-4 rounded-3xl shadow-sm mb-5 text-center">
//           <h3 className="text-[15px] font-serif italic text-slate-800 leading-snug mb-1.5 mix-blend-color-burn">
//             "{data.comentary}"
//           </h3>
//           <p className="text-[10.5px] text-slate-600 font-bold flex items-center justify-center gap-1.5">
//             <Sparkles size={14} style={{ color: primaryColor }} />
//             {data.recommendation}
//           </p>
//         </div>

//         {/* Badges Inferiores */}
//         <div className="flex flex-wrap gap-2.5 justify-center">
          
//           <div className="flex items-center bg-white/70 backdrop-blur-md border border-white rounded-full pr-3 p-1 shadow-sm">
//             <div 
//               className="w-7 h-7 rounded-full flex items-center justify-center mr-2"
//               style={{ backgroundColor: `${primaryColor}25` }}
//             >
//               <HeartPulse size={14} style={{ color: primaryColor }} />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">Score</span>
//               <span className="text-[12px] font-black text-slate-800 leading-none">{data.total_vitality}/100</span>
//             </div>
//           </div>

//           <div className="flex items-center bg-white/70 backdrop-blur-md border border-white rounded-full pr-3 p-1 shadow-sm">
//             <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 bg-green-500/20">
//               <Leaf size={14} className="text-green-600" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">Status</span>
//               <span className="text-[12px] font-black text-slate-800 leading-none">Clean</span>
//             </div>
//           </div>

//           <div className="flex items-center bg-white/70 backdrop-blur-md border border-white rounded-full pr-3 p-1 shadow-sm">
//             <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 bg-blue-500/20">
//               <Zap size={14} className="text-blue-600" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">Powered</span>
//               <span className="text-[12px] font-black text-slate-800 leading-none">ClickDish</span>
//             </div>
//           </div>

//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ResultCard;




// import React from 'react';
// import { Leaf, HeartPulse, Sparkles } from 'lucide-react';

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
//   const totalItems = data.items.length;

//   return (
//     <div 
//       id={id}
//       // Fundo azul escuro (slate-900) idêntico à imagem de referência
//       className="relative w-full max-w-sm mx-auto aspect-[9/16] bg-[#0f172a] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col font-sans"
//     >
//       {/* =========================================
//           1. HEADER (Título visível no fundo escuro)
//           ========================================= */}
//       <div className="w-full pt-10 pb-4 px-6 z-30 text-center relative">
//         {/* Texto do título em branco para dar contraste */}
//         <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
//           {data.meal_name || "Análise do Prato"}
//         </h2>
//         <div className="h-1.5 w-12 bg-orange-400 mx-auto mt-3 rounded-full opacity-100" />
//       </div>

//       {/* =========================================
//           2. ÁREA DA FOTO E ETIQUETAS
//           ========================================= */}
//       <div className="relative flex-1 w-full flex flex-col justify-center px-2 z-20 my-2">
        
//         {/* A foto ocupa o centro (~62% da largura) */}
//         <div className="relative w-[62%] mx-auto aspect-square z-20">
          
//           {/* Imagem do Prato com Borda Branca Grossa */}
//           <div className="w-full h-full rounded-[2rem] border-[6px] border-white overflow-hidden shadow-xl bg-white relative z-20">
//             <img 
//               src={imageSrc} 
//               className="w-full h-full object-cover scale-105" 
//               style={{ filter: 'contrast(1.05) saturate(1.1)' }} 
//               alt="prato"
//               crossOrigin="anonymous" // PREVINE ERRO DE CORS NA EXPORTAÇÃO
//             />
//           </div>

//           {/* SVG Das Linhas Laranjas */}
//           <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10" viewBox="0 0 100 100">
//             {data.items.map((item, idx) => {
//               const yMin = item.box_2d[0] / 10;
//               const xMin = item.box_2d[1] / 10;
//               const yMax = item.box_2d[2] / 10;
//               const xMax = item.box_2d[3] / 10;

//               const targetY = (yMin + yMax) / 2;
//               const targetX = (xMin + xMax) / 2;

//               const isLeft = idx % 2 === 0;
//               const labelY = totalItems > 1 ? 15 + (idx * (70 / Math.max(1, totalItems - 1))) : 50;
              
//               // A linha nasce exatamente na borda da caixa branca
//               const lineStartX = isLeft ? -10 : 110; 

//               return (
//                 <g key={idx}>
//                   {/* Linha reta laranja sólida */}
//                   <line 
//                     x1={lineStartX} 
//                     y1={labelY} 
//                     x2={targetX} 
//                     y2={targetY} 
//                     stroke="#f97316" // bg-orange-500
//                     strokeWidth="2" 
//                     opacity="0.9"
//                   />
//                   {/* Ponto inicial perto da etiqueta */}
//                   <circle cx={lineStartX} cy={labelY} r="2.5" fill="#f97316" />
//                   {/* Ponto final na comida */}
//                   <circle cx={targetX} cy={targetY} r="3.5" fill="#f97316" stroke="white" strokeWidth="1.5" />
//                 </g>
//               );
//             })}
//           </svg>

//           {/* ETIQUETAS BRANCAS SÓLIDAS */}
//           {data.items.map((item, idx) => {
//             const isLeft = idx % 2 === 0;
//             const labelY = totalItems > 1 ? 15 + (idx * (70 / Math.max(1, totalItems - 1))) : 50;

//             return (
//               <div 
//                 key={`label-${idx}`}
//                 // Elas saem do meio para fora, encostando nas laterais do card
//                 className={`absolute transform -translate-y-1/2 flex flex-col z-30 ${
//                   isLeft ? 'right-[100%] translate-x-4' : 'left-[100%] -translate-x-4'
//                 }`}
//                 style={{ top: `${labelY}%` }}
//               >
//                 {/* Caixinha branca sólida, com sombra, texto marinho e calorias laranjas */}
//                 <div className="bg-white px-3 py-2 rounded-xl shadow-lg flex flex-col items-center justify-center min-w-[85px] max-w-[100px] border border-slate-200">
//                   <span className="text-slate-700 text-[8.5px] font-bold uppercase tracking-wide leading-tight mb-1 text-center">
//                     {item.name}
//                   </span>
//                   <span className="font-black text-[12px] text-orange-500 text-center">
//                     {item.calories_est} <span className="text-[8px] font-bold opacity-80 text-slate-400">kcal</span>
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* =========================================
//           3. RODAPÉ (Caixa de Texto e Selos)
//           ========================================= */}
//       <div className="w-full flex flex-col justify-end px-6 pb-8 pt-4 z-20">
        
//         {/* Caixa Branca de Comentário */}
//         <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-lg mb-6 text-center relative z-20">
//           <h3 className="text-[16px] font-serif italic text-slate-700 leading-snug mb-3">
//             "{data.comentary}"
//           </h3>
//           <p className="text-[10.5px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
//             <Sparkles size={14} className="text-orange-400" />
//             {data.recommendation}
//           </p>
//         </div>

//         {/* Badges de Status Inferiores */}
//         <div className="flex flex-wrap gap-4 justify-center relative z-20">
          
//           <div className="flex items-center bg-white border border-slate-200 rounded-full pr-4 p-1 shadow-md">
//             <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-orange-50">
//               <HeartPulse size={16} className="text-orange-500" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Score</span>
//               <span className="text-[13px] font-black text-slate-800 leading-none">{data.total_vitality}/100</span>
//             </div>
//           </div>

//           <div className="flex items-center bg-white border border-slate-200 rounded-full pr-4 p-1 shadow-md">
//             <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-green-50">
//               <Leaf size={16} className="text-green-500" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</span>
//               <span className="text-[13px] font-black text-slate-800 leading-none">Clean</span>
//             </div>
//           </div>

//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ResultCard;