import React from 'react';
import { Camera, ChefHat } from 'lucide-react';

interface ImageUploaderProps {
  image: File | null;
  preview: string | null;
  loading: boolean;
  phraseIndex: number;
  loadingPhrases: string[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploader({ image, preview, loading, phraseIndex, loadingPhrases, onFileChange }: ImageUploaderProps) {
  return (
    <div className={`relative w-full aspect-square bg-slate-800 rounded-3xl border-2 border-dashed ${image ? 'border-brand-500' : 'border-slate-700'} hover:border-brand-500 transition-all flex flex-col items-center justify-center overflow-hidden group shadow-2xl`}>
      
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl animate-fade-in">
          <div className="relative mb-4">
            <ChefHat size={56} className="text-orange-500 animate-bounce" />            
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
        disabled={loading}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={onFileChange}
      />
    </div>
  );
}