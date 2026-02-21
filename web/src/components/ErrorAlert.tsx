import { AlertTriangle, Lock } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface ErrorAlertProps {
  error: { title: string; msg: string };
  session: Session | null;
  onLoginClick: () => void;
}

export function ErrorAlert({ error, session, onLoginClick }: ErrorAlertProps) {
  const isRateLimit = error.title.includes('Muitas');

  return (
    <div className={`p-4 rounded-xl flex gap-3 ${isRateLimit ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-red-500/10 text-red-200 border-red-500/20'} border animate-fade-in`}>
      {isRateLimit ? <AlertTriangle className="shrink-0" /> : <Lock className="shrink-0" />}
      <div>
        <h3 className="font-bold text-sm">{error.title}</h3>
        <p className="text-xs opacity-90">{error.msg}</p>
        {!session && error.title.includes('Limite') && (
          <button onClick={onLoginClick} className="text-xs font-bold underline mt-1 text-brand-400">
            Entrar agora
          </button>
        )}
      </div>
    </div>
  );
}