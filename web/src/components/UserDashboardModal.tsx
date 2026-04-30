/**
 * UserDashboardModal.tsx
 *
 * Displays the logged-in user's account details and subscription status.
 * Mirrors the visual language of AuthModal (light card, slate palette, brand-500 accents)
 * while borrowing the dark-overlay backdrop pattern from UpgradeModal.
 */
import { useEffect, useState } from 'react';
import { X, Mail, Crown, Zap, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanType = 'free' | 'monthly' | 'annual';

interface UsageRecord {
  is_premium: boolean;
  cards_used: number;
  plan_type?: PlanType;
  premium_since?: string;
  premium_expires_at?: string;
}

interface UserDashboardModalProps {
  isOpen: boolean;
  session: Session;
  onClose: () => void;
  onLogout: () => void;
  onUpgradeClick: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREE_LIMIT = 2;
const PREMIUM_MONTHLY_DAILY_LIMIT = 3;
const PREMIUM_ANNUAL_DAILY_LIMIT = 4;

function getPlanLabel(plan: PlanType): string {
  const labels: Record<PlanType, string> = {
    free: 'Conta Gratuita',
    monthly: 'Premium Mensal',
    annual: 'Premium Anual',
  };
  return labels[plan];
}

function getPlanColors(plan: PlanType) {
  if (plan === 'free') {
    return {
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: 'text-slate-400',
    };
  }
  return {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'text-amber-500',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserDashboardModal({
  isOpen,
  session,
  onClose,
  onLogout,
  onUpgradeClick,
}: UserDashboardModalProps) {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  const user = session.user;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuário';
  const email = user.email ?? '—';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Fetch user_profiles record whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadingUsage(true);

    // Compute today's date string in BRT (America/Sao_Paulo, UTC-3)
    // so the daily limit resets at midnight Brazil time, not UTC midnight.
    const brtFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const todayStr = brtFormatter.format(new Date()); // "YYYY-MM-DD" in BRT
    // BRT midnight in ISO 8601 for the DB query (analysis_logs.created_at is UTC)
    const midnightBRT = new Date(`${todayStr}T00:00:00-03:00`).toISOString();

    // Fetch user profile and today's analysis count in parallel
    Promise.all([
      supabase
        .from('user_profiles')
        .select('is_premium, cards_used, plan_type, premium_since, premium_expires_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('analysis_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', midnightBRT),
    ]).then(([profileRes, logsRes]) => {
      if (cancelled) return;
      if (profileRes.error) console.error('[DashboardModal] user_profiles error:', profileRes.error);
      if (logsRes.error) console.error('[DashboardModal] analysis_logs error:', logsRes.error);
      setUsage(profileRes.data ?? { is_premium: false, cards_used: 0 });
      setTodayCount(logsRes.count ?? 0);
      setLoadingUsage(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  // Derive plan
  const planType: PlanType = usage?.is_premium
    ? (usage.plan_type ?? 'monthly') // default to monthly if flag is set but no plan_type stored yet
    : 'free';
  const planLabel = getPlanLabel(planType);
  const planColors = getPlanColors(planType);
  const isPremium = planType !== 'free';

  const cardsUsed = usage?.cards_used ?? 0;

  // Daily limit for premium users
  const premiumDailyLimit = planType === 'annual' ? PREMIUM_ANNUAL_DAILY_LIMIT : PREMIUM_MONTHLY_DAILY_LIMIT;
  const premiumUsagePercent = isPremium ? Math.min((todayCount / premiumDailyLimit) * 100, 100) : 0;

  // Lifetime usage for free users
  const usagePercent = isPremium ? 0 : Math.min((cardsUsed / FREE_LIMIT) * 100, 100);

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header gradient strip ──────────────────────────────────────── */}
        <div className="h-24 bg-gradient-to-br from-[#1a3a2a] via-[#1e4433] to-[#0f2a1c] relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(circle at 70% 50%, #4ade80 0%, transparent 70%)' }}
          />
          <button
            id="dashboard-close-btn"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Avatar overlapping header ──────────────────────────────────── */}
        <div className="flex flex-col items-center -mt-10 px-6 pb-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-black select-none">
            {avatarLetter}
          </div>

          {/* Display name */}
          <h2 className="mt-3 text-lg font-extrabold text-slate-900 text-center leading-tight">
            {displayName}
          </h2>

          {/* Plan badge */}
          {loadingUsage ? (
            <div className="mt-2 flex items-center gap-1.5 text-slate-400 text-xs">
              <Loader2 size={12} className="animate-spin" />
              <span>Carregando plano...</span>
            </div>
          ) : (
            <div
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${planColors.badge}`}
            >
              {isPremium ? (
                <Crown size={12} className={planColors.icon} />
              ) : (
                <Zap size={12} className={planColors.icon} />
              )}
              {planLabel}
            </div>
          )}
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 mx-6" />

        {/* ── Account details ───────────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-3">

          {/* Email row */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail size={15} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* ── Usage / subscription section ──────────────────────────────── */}
        <div className="px-6 pb-4">
          {loadingUsage ? (
            <div className="h-16 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
          ) : isPremium ? (
            // Premium daily usage card
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Crown size={28} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-amber-800">Acesso Premium Ativo</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {premiumDailyLimit} análises por dia ✨
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-amber-700">Análises hoje</p>
                <p className="text-xs font-black text-amber-800">
                  {todayCount}
                  <span className="font-normal text-amber-500"> / {premiumDailyLimit}</span>
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    premiumUsagePercent >= 100 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${premiumUsagePercent}%` }}
                />
              </div>
              {todayCount >= premiumDailyLimit && (
                <p className="text-[10px] text-red-500 font-semibold mt-1.5">
                  Limite diário atingido — volte amanhã para mais análises!
                </p>
              )}
            </div>
          ) : (
            // Free usage bar
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold text-slate-600">Análises utilizadas</p>
                <p className="text-xs font-black text-slate-700">
                  {cardsUsed}
                  <span className="font-normal text-slate-400"> / {FREE_LIMIT}</span>
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent >= 100 ? 'bg-red-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {cardsUsed >= FREE_LIMIT && (
                <p className="text-[10px] text-red-500 font-semibold mt-1.5">
                  Limite atingido — faça upgrade para continuar analisando!
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div className="px-6 pb-6 space-y-2">
          {!isPremium && (
            <button
              id="dashboard-upgrade-btn"
              onClick={() => { onClose(); onUpgradeClick(); }}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 text-white"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
              }}
            >
              <Crown size={16} className="fill-white" />
              Fazer Upgrade para Premium
              <ChevronRight size={14} />
            </button>
          )}

          <button
            id="dashboard-logout-btn"
            onClick={() => { onLogout(); onClose(); }}
            className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} />
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  );
}
