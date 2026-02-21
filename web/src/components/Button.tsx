import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gradient';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  isLoading = false, 
  loadingText, 
  icon, 
  children, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  
  // Estilos base que todos os botões compartilham
  const baseStyles = "w-full py-4 flex items-center justify-center gap-2 rounded-xl transition-all shadow-lg active:scale-95 disabled:cursor-not-allowed";
  
  // Estilos específicos de cada variante
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-slate-900 font-bold text-lg shadow-brand-500/20 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none",
    gradient: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black border border-orange-400/50 shadow-orange-500/30 uppercase tracking-wide text-sm disabled:opacity-50"
  };

  return (
    <button 
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Se estiver carregando, mostra o spinner. Se não, mostra o ícone (caso tenha sido passado) */}
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : icon}
      
      {/* Se estiver carregando e tiver texto de loading, mostra ele. Senão, mostra o texto normal */}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}