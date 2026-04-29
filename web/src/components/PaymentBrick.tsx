import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import axios from 'axios';

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || '';

if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
}

export type PaymentStatus = 'idle' | 'loading' | 'success' | 'pending' | 'error';

interface PaymentResult {
  status: PaymentStatus;
  paymentId?: number;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  statusDetail?: string;
  errorMessage?: string;
}

interface PaymentBrickProps {
  amount: number;
  onPaymentResult: (result: PaymentResult) => void;
}

export default function PaymentBrick({ amount, onPaymentResult }: PaymentBrickProps) {
  const [brickReady, setBrickReady] = useState(false);
  const amountRef = useRef(amount);
  const onPaymentResultRef = useRef(onPaymentResult);

  useEffect(() => {
    amountRef.current = amount;
    onPaymentResultRef.current = onPaymentResult;
  }, [amount, onPaymentResult]);

  useEffect(() => {
    if (!MP_PUBLIC_KEY) {
      console.error('VITE_MP_PUBLIC_KEY não configurada.');
      onPaymentResult({
        status: 'error',
        errorMessage: 'Chave pública do Mercado Pago não configurada.',
      });
    }
  }, []);

  const initialization = useMemo(() => ({
    amount,
  }), [amount]);

  const customization = useMemo(() => ({
    paymentMethods: {
      bankTransfer: 'all' as const,
      creditCard: 'all' as const,
    },
    visual: {
      style: {
        theme: 'default' as const,
        customVariables: {
          formBackgroundColor: '#ffffff',
          baseColor: '#10B981',
        },
      },
    },
  }), []);

  const handleSubmit = useCallback(async (outerData: any) => {
    const inner = outerData?.formData ?? outerData;

    onPaymentResultRef.current({ status: 'loading' });

    const paymentMethodId =
      inner.payment_method_id ||
      outerData?.selectedPaymentMethod ||
      (outerData?.paymentType === 'bank_transfer' ? 'pix' : undefined);

    const payerEmail = inner.payer?.email || '';

    try {
      const response = await axios.post(`${API_URL}/api/process_payment`, {
        transaction_amount: inner.transaction_amount || amountRef.current,
        payment_method_id: paymentMethodId,
        token: inner.token || null,
        installments: inner.installments || 1,
        payer: {
          email: payerEmail,
        },
        description: 'ClickDish Premium',
        idempotency_key: crypto.randomUUID(),
      });

      const payment = response.data.payment;

      if (payment.status === 'approved') {
        onPaymentResultRef.current({
          status: 'success',
          paymentId: payment.payment_id,
          statusDetail: payment.status_detail,
        });
      } else if (payment.status === 'pending' || payment.status === 'in_process') {
        onPaymentResultRef.current({
          status: 'pending',
          paymentId: payment.payment_id,
          qrCode: payment.qr_code,
          qrCodeBase64: payment.qr_code_base64,
          ticketUrl: payment.ticket_url,
          statusDetail: payment.status_detail,
        });
      } else {
        onPaymentResultRef.current({
          status: 'error',
          paymentId: payment.payment_id,
          statusDetail: payment.status_detail,
          errorMessage: `Pagamento ${payment.status}: ${payment.status_detail}`,
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao processar pagamento:', err);

      let errorMessage = 'Erro ao processar pagamento. Tente novamente.';

      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail?.message) {
          errorMessage = detail.message;
        }
      }

      onPaymentResultRef.current({
        status: 'error',
        errorMessage,
      });
    }
  }, []);

  const handleReady = useCallback(() => {
    setBrickReady(true);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Erro no Payment Brick:', error);
    onPaymentResultRef.current({
      status: 'error',
      errorMessage: 'Erro ao carregar formulário de pagamento.',
    });
  }, []);

  if (!MP_PUBLIC_KEY) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
        ⚠️ Chave pública do Mercado Pago não configurada.
      </div>
    );
  }

  return (
    <div className="w-full" id="payment-brick-container">
      {!brickReady && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          <span className="ml-3 text-slate-500 text-sm">Carregando métodos de pagamento...</span>
        </div>
      )}

      <Payment
        initialization={initialization}
        customization={customization}
        onSubmit={handleSubmit}
        onReady={handleReady}
        onError={handleError}
      />
    </div>
  );
}
