import { User, LogIn } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import ClickDishIcon from '../assets/logotipo-v1.webp';

interface HeaderProps {
  session: Session | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export function Header({ session, onLoginClick, onLogoutClick }: HeaderProps) {
  return (
    <header className="w-full flex items-center justify-between py-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
        <img className='h-12' src={ClickDishIcon} alt="Descrição da imagem" />
        <div className='font-bold text-3xl 
           bg-gradient-to-r from-blue-600 to-orange-600 
           bg-clip-text text-transparent 
           -[webkit-text-stroke:1px_white]'>
          ClickDish
        </div>
      </h1>

      <div className="flex items-center gap-3">
        {session ? (
          <div className="flex items-center gap-2">
            <div className="text-xs text-right hidden sm:block">
              <p className="text-slate-300 font-bold">Olá, Chef</p>
              <button onClick={onLogoutClick} className="text-slate-500 hover:text-red-400 transition-colors">Sair</button>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center border border-brand-500/50">
              <User size={16} className="text-brand-400" />
            </div>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 hover:border-brand-500 transition-colors flex items-center gap-2"
          >
            <LogIn size={14} /> Entrar
          </button>
        )}
      </div>
    </header>
  );
}