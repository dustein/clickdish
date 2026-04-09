/**
 * PaymentPage.tsx
 * 
 * Página completa de checkout do ClickDish Premium.
 * Exibe resumo do plano, o Payment Brick e estados de feedback
 * (Sucesso / Pendente-PIX / Erro).
 */
import { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Copy, X, Sparkles, Shield, Zap, ArrowLeft } from 'lucide-react';
import PaymentBrick, { type PaymentStatus } from './PaymentBrick';

interface PaymentResult {
  status: PaymentStatus;
  paymentId?: number;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  statusDetail?: string;
  errorMessage?: string;
}

interface PaymentPageProps {
  onClose: () => void;
  onSuccess?: () => void;
  planAmount?: number;
  planName?: string;
  planPeriod?: string;
}

export default function PaymentPage({
  onClose,
  onSuccess,
  planAmount = 9.90,
  planName = 'ClickDish Premium',
  planPeriod = '/mês',
}: PaymentPageProps) {
  const [paymentResult, setPaymentResult] = useState<PaymentResult>({ status: 'idle' });
  const [pixCopied, setPixCopied] = useState(false);

  const handlePaymentResult = (result: PaymentResult) => {
    setPaymentResult(result);
    // Não fechamos mais automaticamente com setTimeout.
    // O usuário fechará manualmente clicando no botão "Começar a Usar",
    // que chamará onClose (e por tabela, chamará onSuccess se precisarmos adicionar no botão futuro).
  };

  const handleCopyPix = async () => {
    if (paymentResult.qrCode) {
      try {
        await navigator.clipboard.writeText(paymentResult.qrCode);
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
      } catch {
        // Fallback para navegadores sem clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = paymentResult.qrCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 3000);
      }
    }
  };

  const handleRetry = () => {
    setPaymentResult({ status: 'idle' });
  };

  // =================================================================
  // TELA DE SUCESSO
  // =================================================================
  if (paymentResult.status === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
          {/* Decoração de fundo */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-600 rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10">
            {/* Ícone animado */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-bounce">
              <CheckCircle size={40} className="text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Pagamento Aprovado!</h2>
            <p className="text-slate-500 mb-6">Seu plano Premium está ativo. Aproveite análises ilimitadas! 🎉</p>

            {paymentResult.paymentId && (
              <p className="text-xs text-slate-400 mb-6">
                ID do Pagamento: <span className="font-mono">#{paymentResult.paymentId}</span>
              </p>
            )}

            <button
              onClick={onSuccess || onClose}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-bold text-base shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 active:scale-[0.98] transition-all"
            >
              Começar a Usar ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // TELA DE PIX PENDENTE
  // =================================================================
  if (paymentResult.status === 'pending' && paymentResult.qrCodeBase64) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative">
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>

          <div className="text-center">
            {/* Ícone */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={28} className="text-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Pagamento PIX Gerado</h2>
            <p className="text-sm text-slate-500 mb-5">Escaneie o QR Code abaixo ou copie o código PIX</p>

            {/* QR Code */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 mb-4 inline-block shadow-inner">
              <img
                src={`data:image/png;base64,${paymentResult.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-52 h-52 mx-auto"
              />
            </div>

            {/* Código PIX Copia e Cola */}
            {paymentResult.qrCode && (
              <div className="mb-5">
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <code className="flex-1 text-xs text-slate-600 truncate font-mono">
                    {paymentResult.qrCode.substring(0, 40)}...
                  </code>
                  <button
                    onClick={handleCopyPix}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pixCopied
                        ? 'bg-brand-500 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Copy size={14} />
                    {pixCopied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            {/* Valor */}
            <div className="bg-brand-500/10 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-sm text-brand-700 font-bold">
                Valor: R$ {planAmount.toFixed(2).replace('.', ',')}
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Após o pagamento ser confirmado, seu plano será ativado automaticamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // TELA DE ERRO
  // =================================================================
  if (paymentResult.status === 'error') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>

          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">Pagamento não aprovado</h2>
          <p className="text-sm text-slate-500 mb-6">
            {paymentResult.errorMessage || 'Ocorreu um erro ao processar o pagamento.'}
          </p>

          <button
            onClick={handleRetry}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // =================================================================
  // TELA PRINCIPAL — CHECKOUT
  // =================================================================
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl border-b border-slate-100 px-6 py-2 flex items-center gap-3 z-10">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Seja Premium :</h2>
        </div>

        <div className="p-6 flex flex-col gap-1">
          {/* Resumo do Plano */}
          <div className="bg-gradient-to-br from-brand-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/80">Plano</p>
                <h3 className="text-lg font-bold">{planName}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-2xl font-black">R$ {planAmount.toFixed(2).replace('.', ',')}</span>
              <span className="text-sm text-white/70">{planPeriod}</span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Zap size={14} className="flex-shrink-0" /> 
                {planPeriod === '/ano' ? 'Análise de 4 refeições por dia' : 'Análise 3 refeições por dia'}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Shield size={14} className="flex-shrink-0" /> 
                Histórico completo
              </div>
            </div>
          </div>

          {/* Loading State */}
          {paymentResult.status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">Processando pagamento...</p>
            </div>
          )}

          {/* Payment Brick */}
          {paymentResult.status !== 'loading' && (
            <div className="pb-2 flex flex-col">
              <PaymentBrick amount={planAmount} onPaymentResult={handlePaymentResult} />
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-slate-500 text-sm bg-slate-50 hover:bg-slate-100 hover:text-slate-700 transition-colors border border-slate-200 shadow-sm"
              >
                Voltar e alterar plano
              </button>
            </div>
          )}

          {/* Selos de segurança */}
          <div className="flex items-center justify-center gap-4 pt-2 pb-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield size={14} />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <img
                src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/badge.svg"
                alt="Mercado Pago"
                className="h-4 opacity-50"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span>Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
