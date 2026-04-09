import { LogIn } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import ClickDishIcon from '../assets/logotipo-v2.webp';

interface HeaderProps {
  session: Session | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onDashboardClick?: () => void;
}

export function Header({ session, onLoginClick, onDashboardClick }: HeaderProps) {
  const displayName =
    session?.user.user_metadata?.full_name ||
    session?.user.user_metadata?.name ||
    session?.user.email?.split('@')[0] ||
    'U';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="w-full flex items-center justify-between pb-4">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-brand-500 tracking-tight">
        <img className='h-14 sm:h-12' src={ClickDishIcon} alt="ClickDish logo" />
        <div className='font-bold text-xl sm:text-3xl bg-linear-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent'>
          ClickDish
        </div>
      </h1>

      <div className="flex items-center gap-3">
        {session ? (
          <button
            id="header-dashboard-btn"
            onClick={onDashboardClick}
            title={`Conta de ${displayName}`}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white font-black text-base flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 select-none"
          >
            {avatarLetter}
          </button>
        ) : (
          <button
            id="header-login-btn"
            onClick={onLoginClick}
            className="text-xs font-bold text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <LogIn size={14} /> Entrar
          </button>
        )}
      </div>
    </header>
  );
}