import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import ClickDishIcon from '../assets/logotipo-v2.webp';
import PaymentPage from './PaymentPage';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_PLAN_AMOUNT = 9.90;
const YEAR_PLAN_AMOUNT = 83.90;

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  const currentPlan = selectedPlan === 'monthly' ? {
    amount: MONTH_PLAN_AMOUNT,
    name: "ClickDish Premium - Mensal",
    period: "/mês"
  } : {
    amount: YEAR_PLAN_AMOUNT,
    name: "ClickDish Premium - Anual",
    period: "/ano"
  };

  // Se o usuário clicou em "Assinar", mostra a página de pagamento
  if (showPayment) {
    return (
      <PaymentPage
        onClose={() => {
          setShowPayment(false);
        }}
        onSuccess={() => {
          setShowPayment(false);
          onClose();
        }}
        planAmount={currentPlan.amount}
        planName={currentPlan.name}
        planPeriod={currentPlan.period}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">

        {/* Gradiente de fundo premium */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a] via-[#1e4433] to-[#0f2a1c] pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 20%, #4ade80 0%, transparent 60%)' }} />

        {/* Conteúdo */}
        <div className="relative z-10 px-7 pt-8 pb-8 flex flex-col items-center text-center overflow-y-auto">

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Logo */}
          <div className='flex items-center justify-center gap-2 mb-6'>
            <img src={ClickDishIcon} alt="ClickDish" className="h-10" />
            <div className='font-bold text-xl sm:text-3xl
            bg-linear-to-r from-blue-600 to-orange-600 
            bg-clip-text text-transparent'>
            ClickDish
            </div>

          </div>

          <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight mb-4">
            Transforme cada refeição em um post épico!
          </h2>

          <p className="text-sm text-white/60 leading-relaxed mb-2">
            Não pare agora! Desbloqueie análises diárias, nomes criativos para seus pratos e mostre ao mundo sua consistência nos seus objetivos com cards exclusivos.
          </p>
          <p className="text-sm text-white/60 leading-relaxed mb-6">Porque Atitude Fitness e Alimentação Saudável devem ser divertidos!</p>

          {/* Seleção de Plano */}
          <div className="w-full flex gap-3 mb-6">
            {/* Mensal */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 rounded-2xl border p-2 transition-all relative ${
                selectedPlan === 'monthly'
                  ? 'bg-brand-500/20 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-sm font-semibold text-white mb-1">Mensal</div>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-sm font-black text-white">R$ 9,90</span>
                <span className="text-xs text-white/50">/mês</span>
              </div>
              <div className="text-[10px] text-white/40">Cancele quando quiser</div>
            </button>

            {/* Anual */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={`flex-1 rounded-2xl border p-4 transition-all relative ${
                selectedPlan === 'annual'
                  ? 'bg-brand-500/20 border-brand-500 ring-1 ring-brand-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap shadow-lg">
                30% mais barato
              </div>
              <div className="text-sm font-semibold text-white mb-1">Anual</div>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-sm font-black text-white">R$ 83,90</span>
                <span className="text-xs text-white/50">/ano</span>
              </div>
              <div className="text-[10px] text-white/80 font-medium">Equivale a R$ 6,99/mês</div>
            </button>
          </div>

          {/* CTA principal — agora abre o checkout */}
          <button
            onClick={() => setShowPayment(true)}
            className="w-full mb-4 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              boxShadow: '0 6px 24px rgba(34,197,94,0.35)',
            }}
          >
            <Zap size={18} className="fill-white animate-pulse" />
            Assinar ClickDish Premium
          </button>

          {/* Benefícios */}
          <ul className="w-full space-y-2.5 mb-8 text-left">
            {[
              'Valores Promocionais de Lançamento !',
              'Análise de até 3 refeições por dia no plano mensal, ou 4 no plano anual.',
              'Histórico exclusivo das suas refeições',
              'Dicas personalizadas dos nutrientes do seu prato.',
              'Cards incríveis para compartilhar.',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-white/80 font-medium">{item}</span>
              </li>
            ))}
          </ul>          

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors flex justify-center items-center gap-2"
          >
            <X size={28} />
            <span>Fechar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
