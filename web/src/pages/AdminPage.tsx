/**
 * AdminPage.tsx
 *
 * Hidden admin dashboard. Accessible via /admin route only.
 * Strictly gated to steindu@gmail.com — all others are redirected to a
 * "403 Forbidden" screen. No navigation links point to this page.
 */
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import {
  Users, Search, ChevronLeft, ChevronRight,
  Crown, Zap, ShieldAlert, Loader2, RefreshCw,
  LogIn,
} from 'lucide-react';

const ADMIN_EMAIL = 'steindu@gmail.com';
const PAGE_SIZE = 20;
const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  registered_at: string;
  last_sign_in: string;
  total_analyses: number;
  analyses_today: number;
  is_premium: boolean;
  plan_type: 'free' | 'monthly' | 'annual';
  subscription_date: string;
}

type LoadState = 'idle' | 'checking_auth' | 'loading' | 'ready' | 'forbidden' | 'unauthenticated' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function PlanBadge({ plan }: { plan: AdminUser['plan_type'] }) {
  if (plan === 'annual') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
        <Crown size={9} /> Anual
      </span>
    );
  }
  if (plan === 'monthly') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
        <Zap size={9} /> Mensal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-400 border border-slate-600/30">
      Gratuito
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [loadState, setLoadState] = useState<LoadState>('checking_auth');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ── Auth check + data fetch ──────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoadState('loading');
    setErrorMsg('');

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setLoadState('unauthenticated');
      return;
    }

    if (session.user.email !== ADMIN_EMAIL) {
      setLoadState('forbidden');
      return;
    }

    try {
      const res = await axios.get<{ users: AdminUser[]; total: number }>(
        `${API_URL}/api/admin/users`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setUsers(res.data.users);
      setPage(1);
      setLoadState('ready');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setLoadState('forbidden');
        } else {
          setErrorMsg(err.response?.data?.detail || 'Erro ao carregar usuários.');
          setLoadState('error');
        }
      } else {
        setErrorMsg('Erro inesperado.');
        setLoadState('error');
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Filtered + paginated data ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 on new search
  useEffect(() => { setPage(1); }, [search]);

  // ── Render states ────────────────────────────────────────────────────────

  if (loadState === 'checking_auth' || loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center flex-col gap-4">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm">
          {loadState === 'checking_auth' ? 'Verificando credenciais...' : 'Carregando usuários...'}
        </p>
      </div>
    );
  }

  if (loadState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <LogIn size={48} className="text-slate-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Não autenticado</h1>
          <p className="text-slate-400 text-sm">
            Faça login com sua conta de administrador para acessar este painel.
          </p>
        </div>
      </div>
    );
  }

  if (loadState === 'forbidden') {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <ShieldAlert size={56} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400 text-sm">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-[#0f1923] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <ShieldAlert size={48} className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Erro ao carregar</h1>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={fetchUsers}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Main admin table ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1923] text-slate-200 font-sans">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="border-b border-white/5 bg-[#111d2b]/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Users size={16} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight">Painel Admin</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">ClickDish — Restrito</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchUsers}
            title="Atualizar"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <RefreshCw size={14} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="admin-search"
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="px-6 pb-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5">
              {['Nome / E-mail', 'Cadastro', 'Data do Plano', 'Último Login', 'Análises (Hoje / Total)', 'Plano'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 pr-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-slate-600">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              pageSlice.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >
                  {/* Name + email */}
                  <td className="py-3.5 pr-6">
                    <p className="font-semibold text-slate-100 truncate max-w-[200px]">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{u.email}</p>
                  </td>

                  {/* Registered date */}
                  <td className="py-3.5 pr-6 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(u.registered_at)}
                  </td>

                  {/* Subscription date */}
                  <td className="py-3.5 pr-6 text-xs text-slate-400 whitespace-nowrap">
                    {u.is_premium ? formatDate(u.subscription_date) : '—'}
                  </td>

                  {/* Last sign in */}
                  <td className="py-3.5 pr-6 text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(u.last_sign_in)}
                  </td>

                  {/* Total analyses */}
                  <td className="py-3.5 pr-6">
                    <span className={`font-bold text-sm ${u.analyses_today > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {u.analyses_today} <span className="text-[10px] text-slate-500 font-normal">({u.total_analyses})</span>
                    </span>
                  </td>

                  {/* Plan */}
                  <td className="py-3.5">
                    <PlanBadge plan={u.plan_type} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="px-6 pb-8 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="admin-prev-page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page numbers (show up to 5 around current) */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - currentPage) <= 2)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                    n === currentPage
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}

            <button
              id="admin-next-page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
