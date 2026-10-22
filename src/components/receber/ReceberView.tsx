import React, { useState } from 'react';
import {
  CreditCard,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReceivableItem } from '../../types';
import { Modal } from '../common/Modal';

export const ReceberView: React.FC = () => {
  const {
    receivables,
    receivePayment,
    generateWhatsAppMessage,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // WhatsApp charge modal
  const [selectedReceivableForWhatsApp, setSelectedReceivableForWhatsApp] =
    useState<ReceivableItem | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Settlement confirm modal
  const [selectedReceivableForPay, setSelectedReceivableForPay] =
    useState<ReceivableItem | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const filteredReceivables = receivables.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'ATRASADO') return r.status === 'ATRASADO';
    if (filterStatus === 'HOJE') return r.status === 'HOJE';
    if (filterStatus === 'PENDENTE') return r.status === 'PENDENTE';
    if (filterStatus === 'PAGO') return r.status === 'PAGO';
    return true;
  });

  const handleOpenWhatsAppModal = (item: ReceivableItem) => {
    setSelectedReceivableForWhatsApp(item);
    setCopiedPix(false);
    setCopiedMessage(false);
  };

  const handleSendViaWhatsAppWeb = () => {
    if (!selectedReceivableForWhatsApp) return;
    const cleanPhone = selectedReceivableForWhatsApp.customerPhone.replace(/\D/g, '');
    const message = generateWhatsAppMessage(selectedReceivableForWhatsApp);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  const handleOpenPayModal = (item: ReceivableItem) => {
    setSelectedReceivableForPay(item);
    setPayAmountInput(item.amount);
  };

  const handleConfirmPayment = () => {
    if (selectedReceivableForPay && payAmountInput > 0) {
      receivePayment(selectedReceivableForPay.id, payAmountInput);
      setSelectedReceivableForPay(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Controle de Contas a Receber & Inadimplência
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão completa de recebíveis, controle de inadimplência e envio de cobranças automáticas via WhatsApp com baixa integrada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold">
            🔴 Atrasados:{' '}
            {receivables.filter((r) => r.status === 'ATRASADO').length} clientes
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('TODOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              filterStatus === 'TODOS'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({receivables.length})
          </button>
          <button
            onClick={() => setFilterStatus('ATRASADO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              filterStatus === 'ATRASADO'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            🔴 Atrasado
          </button>
          <button
            onClick={() => setFilterStatus('HOJE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              filterStatus === 'HOJE'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            🟢 Hoje
          </button>
          <button
            onClick={() => setFilterStatus('PENDENTE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              filterStatus === 'PENDENTE'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            🟡 Pendente
          </button>
        </div>
      </div>

      {/* Main Table Matching Slide 6 Layout:
          Cliente | Valor | Vencimento | Situação:
          João R$ 450 05/10 🔴 Atrasado
          Pedro R$ 280 07/10 🟢 Hoje
          Maria R$ 652 12/10 🟡 Pendente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-5">Cliente</th>
                <th className="py-3.5 px-5">Valor</th>
                <th className="py-3.5 px-5">Vencimento</th>
                <th className="py-3.5 px-5">Situação</th>
                <th className="py-3.5 px-5 text-right">Ação de Cobrança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-2xl">🎉</span>
                      <strong className="text-slate-700 font-bold">Nenhuma conta pendente a receber!</strong>
                      <span className="text-slate-400">Quando emitir pedidos a prazo, as parcelas e cobranças de WhatsApp aparecerão aqui.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((item) => {
                const isOverdue = item.status === 'ATRASADO';
                const isToday = item.status === 'HOJE';
                const isPending = item.status === 'PENDENTE';
                const isPaid = item.status === 'PAGO';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOverdue ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Cliente */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.customerPhone} {item.description && `• ${item.description}`}
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-slate-900 text-base">
                        {formatCurrency(item.amount)}
                      </span>
                    </td>

                    {/* Vencimento */}
                    <td className="py-4 px-5">
                      <span className="font-semibold text-slate-700 text-sm">
                        {formatDate(item.dueDate)}
                      </span>
                      {isOverdue && item.daysOverdue > 0 && (
                        <span className="text-[11px] text-rose-600 block mt-0.5 font-bold">
                          {item.daysOverdue} dias em atraso
                        </span>
                      )}
                    </td>

                    {/* Situação (Exact pills from Slide 6) */}
                    <td className="py-4 px-5">
                      {isOverdue && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                          <span>🔴</span>
                          <span>Atrasado</span>
                        </div>
                      )}
                      {isToday && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span>🟢</span>
                          <span>Hoje</span>
                        </div>
                      )}
                      {isPending && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          <span>🟡</span>
                          <span>Pendente</span>
                        </div>
                      )}
                      {isPaid && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600">
                          <span>✅</span>
                          <span>Pago</span>
                        </div>
                      )}
                    </td>

                    {/* Botão: Cobrar pelo WhatsApp + Baixa (As described in Slide 6) */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {!isPaid ? (
                        <div className="inline-flex items-center gap-2">
                          {/* Botão: Cobrar pelo WhatsApp */}
                          <button
                            onClick={() => handleOpenWhatsAppModal(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Cobrar pelo WhatsApp</span>
                          </button>

                          {/* Botão: Baixar Pagamento */}
                          <button
                            onClick={() => handleOpenPayModal(item)}
                            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            title="Registrar recebimento total ou parcial deste valor"
                          >
                            Baixar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold">
                          Recebimento concluído
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cobrar pelo WhatsApp (Slide 6 - "O sistema poderia abrir uma mensagem pronta para o cliente") */}
      {selectedReceivableForWhatsApp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceivableForWhatsApp(null)}
          title={`Cobrança via WhatsApp • ${selectedReceivableForWhatsApp.customerName}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                Mensagem Automática Pronta Gerada pelo Sistema
              </p>
              <p className="text-[11px] text-emerald-800 mt-1">
                Inclui o nome do cliente, o valor exato, a data de vencimento e a chave Pix configurada da empresa ({settings.companyName}).
              </p>
            </div>

            {/* Generated WhatsApp text message preview */}
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-sans text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 relative">
              {generateWhatsAppMessage(selectedReceivableForWhatsApp)}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Destinatário: <strong>{selectedReceivableForWhatsApp.customerPhone}</strong></span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    generateWhatsAppMessage(selectedReceivableForWhatsApp)
                  );
                  setCopiedMessage(true);
                  setTimeout(() => setCopiedMessage(false), 2000);
                }}
                className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar texto
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReceivableForWhatsApp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSendViaWhatsAppWeb}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir Mensagem no WhatsApp</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Baixa / Recebimento com Valor Pago */}
      {selectedReceivableForPay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceivableForPay(null)}
          title={`Baixar Recebimento • ${selectedReceivableForPay.customerName}`}
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Cliente:</span>
                <strong className="text-slate-900 text-sm font-extrabold">{selectedReceivableForPay.customerName}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Saldo em Aberto:</span>
                <strong className="text-amber-700 text-sm font-extrabold">{formatCurrency(selectedReceivableForPay.amount)}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Qual o valor pago pelo cliente? (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedReceivableForPay.amount}
                  value={payAmountInput || ''}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                  placeholder="0,00"
                  autoFocus
                />
              </div>

              {/* Botões de atalho rápido */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPayAmountInput(selectedReceivableForPay.amount)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                >
                  Pagar Total ({formatCurrency(selectedReceivableForPay.amount)})
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmountInput(+(selectedReceivableForPay.amount / 2).toFixed(2))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  50% ({formatCurrency(selectedReceivableForPay.amount / 2)})
                </button>
              </div>
            </div>

            {/* Explicação de baixa total ou parcial */}
            {payAmountInput >= selectedReceivableForPay.amount ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Baixa Total (Valor Integral)
                </p>
                <p className="text-[11px] text-emerald-800">
                  Esta conta e os pedidos correspondentes serão marcados como <strong>PAGO</strong>. O saldo devedor na Ficha de Clientes será zerado e liberado para novas compras a prazo.
                </p>
              </div>
            ) : payAmountInput > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Baixa Parcial (Continuará Pendente)
                </p>
                <p className="text-[11px] text-amber-800">
                  O cliente pagará <strong>{formatCurrency(payAmountInput)}</strong> e restará <strong>{formatCurrency(selectedReceivableForPay.amount - payAmountInput)}</strong> pendente. O saldo em aberto na Ficha de Clientes será amortizado com o valor pago.
                </p>
              </div>
            ) : null}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReceivableForPay(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={payAmountInput <= 0}
                onClick={handleConfirmPayment}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer shadow-xs"
              >
                Confirmar Baixa ({formatCurrency(payAmountInput || 0)})
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
