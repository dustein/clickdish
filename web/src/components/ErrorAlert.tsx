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
    <div className={`p-4 rounded-xl flex gap-3 ${isRateLimit ? 'bg-orange-50 text-orange-900 border-orange-200' : 'bg-red-50 text-red-900 border-red-200'} border animate-fade-in shadow-sm`}>
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