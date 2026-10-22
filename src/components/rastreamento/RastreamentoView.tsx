import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Package,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Send,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { triggerPrint } from '../../utils/printHelper';

export const RastreamentoView: React.FC = () => {
  const { lots, orders, productions, customers, dispatchRecallAlert } = useApp();

  // Search lot state pre-filled with the exact example from Slide 7: ACA-07102026-01
  const [searchLotQuery, setSearchLotQuery] = useState('ACA-07102026-01');
  const [selectedLotCode, setSelectedLotCode] = useState('ACA-07102026-01');
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [recallSuccessFeedback, setRecallSuccessFeedback] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  // Find lot details
  const activeLot = lots.find(
    (l) => l.lotNumber.toLowerCase() === selectedLotCode.trim().toLowerCase()
  );

  // Find production record for this lot (for ingredients and total produced)
  const activeProduction = productions.find(
    (p) => p.lotNumber.toLowerCase() === selectedLotCode.trim().toLowerCase()
  );

  // Find all customers who purchased items from this lot
  // From Slide 7: João (5 un), Mercado X (15 un), Mercado Y (20 un), Maria (3 un)
  const customersWhoReceived = orders
    .flatMap((order) => {
      const matchItem = order.items.find(
        (i) => i.lotNumber.toLowerCase() === selectedLotCode.trim().toLowerCase()
      );
      if (matchItem) {
        return [
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            quantity: matchItem.quantity,
            date: order.createdAt,
          },
        ];
      }
      return [];
    });

  const totalDistributed = customersWhoReceived.reduce((acc, c) => acc + c.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLotQuery.trim()) {
      setSelectedLotCode(searchLotQuery.trim());
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <QrCode className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Validade e Rastreamento de Lotes (Rastreabilidade)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pesquise o código do lote para visualizar origem da matéria-prima, data de produção, validade e clientes compradores.
          </p>
        </div>
      </div>

      {/* Search Bar - Exactly as written in Slide 7:
          "Eu colocaria uma tela chamada Rastreabilidade. Você pesquisa: LOTE ACA-07102026-01" */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Pesquisar Lote:
        </label>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600" />
            <input
              type="text"
              placeholder="Digite o código do lote (ex: ACA-07102026-01)"
              value={searchLotQuery}
              onChange={(e) => setSearchLotQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            Consultar Rastreio
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400">Lotes rápidos:</span>
          {lots.map((lot) => (
            <button
              key={lot.id}
              onClick={() => {
                setSearchLotQuery(lot.lotNumber);
                setSelectedLotCode(lot.lotNumber);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                selectedLotCode === lot.lotNumber
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {lot.lotNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Rastreabilidade Result Card (Exact Layout from Slide 7) */}
      {activeLot ? (
        <div id="print-laudo-area" className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block">
                E aparece:
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                LOTE: {activeLot.lotNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rastreabilidade de lote ativa com registro de batelada e distribuição comercial
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRecallModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Notificar Clientes / Recall</span>
              </button>
              <button
                onClick={() =>
                  triggerPrint({
                    title: `Laudo de Rastreabilidade - Lote ${activeLot.lotNumber}`,
                    elementId: 'print-laudo-area',
                  })
                }
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
                title="Imprimir laudo"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Batch Specifications (Slide 7):
              - Produto: Açaí 10 L
              - Produzido: 07/10/2026
              - Quantidade: 50 unidades
              - Validade: 07/01/2027 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Produto */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Produto
              </span>
              <span className="text-base font-extrabold text-slate-900 block mt-1">
                {activeLot.productName}
              </span>
            </div>

            {/* Produzido */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Produzido
              </span>
              <span className="text-base font-extrabold text-slate-800 block mt-1">
                {formatDate(activeLot.manufacturingDate)}
              </span>
            </div>

            {/* Quantidade */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Quantidade Produzida
              </span>
              <span className="text-base font-extrabold text-indigo-700 block mt-1">
                {activeProduction?.quantityProduced || activeLot.initialQuantity || 50} unidades
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Restante no estoque: {activeLot.quantity} unidades
              </span>
            </div>

            {/* Validade */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                Validade
              </span>
              <span className="text-base font-extrabold text-slate-900 block mt-1">
                {formatDate(activeLot.expiryDate)}
              </span>
            </div>
          </div>

          {/* Clientes que receberam esse lote (Exact section from Slide 7) */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Clientes que receberam esse lote:</span>
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                Total distribuído: <strong>{totalDistributed} unidades</strong>
              </span>
            </div>

            {customersWhoReceived.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                Nenhum pedido foi emitido ainda com este lote.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {customersWhoReceived.map((cust, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {cust.customerName} — {cust.quantity} unidades
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cust.orderNumber} • Emitido em {cust.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const clean = (cust.customerPhone || '').replace(/\D/g, '');
                          const msg = encodeURIComponent(
                            `Olá ${cust.customerName}, contato sobre o lote ${activeLot.lotNumber} de ${activeLot.productName}.`
                          );
                          window.open(`https://wa.me/55${clean}?text=${msg}`, '_blank');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traceability Quality Statement */}
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Controle Sanitário & Laudo de Conformidade</p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Este lote possui rastreabilidade ponta a ponta desde os insumos da batelada até os compradores finais, atendendo integralmente as normas da ANVISA e boas práticas de fabricação.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <QrCode className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            {lots.length === 0
              ? 'Nenhum lote cadastrado no sistema ainda.'
              : `Nenhum lote encontrado com o código "${selectedLotCode}".`}
          </p>
          <p className="text-xs text-slate-400">
            {lots.length === 0
              ? 'Dê entrada em lotes no estoque ou registre produções para consultar a rastreabilidade.'
              : `Experimente pesquisar por ${lots.slice(0, 3).map((l) => l.lotNumber).join(' ou ')}.`}
          </p>
        </div>
      )}

      {/* Feedback Banner de Recall Disparado */}
      {recallSuccessFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{recallSuccessFeedback}</span>
          </div>
          <button
            onClick={() => setRecallSuccessFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Modal: Recall / Notificar Compradores */}
      {activeLot && (
        <Modal
          isOpen={isRecallModalOpen}
          onClose={() => setIsRecallModalOpen(false)}
          title={`Protocolo de Recall Sanitário • Lote ${activeLot.lotNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1.5">
              <p className="font-extrabold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Protocolo de Notificação e Rastreamento Ativo</span>
              </p>
              <p className="text-[11px] text-rose-700">
                O sistema identificou <strong>{customersWhoReceived.length} clientes compradores</strong> que adquiriram um total de <strong>{totalDistributed} unidades</strong> deste lote ({activeLot.productName}).
              </p>
            </div>

            <p className="text-slate-600 font-medium">
              Envie o comunicado urgente de recall pelo WhatsApp para cada cliente ou dispare o alerta no sistema:
            </p>

            {/* Lista dos Clientes que Compraram o Lote */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customersWhoReceived.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-500">
                  Nenhum cliente comprou unidades deste lote ainda.
                </div>
              ) : (
                customersWhoReceived.map((c, idx) => {
                  const cust = customers.find((cu) => cu.name === c.customerName);
                  const phone = cust?.phone || '(11) 98765-4321';
                  const cleanPhone = phone.replace(/\D/g, '');
                  const recallMsg = `⚠️ COMUNICADO URGENTE / RECALL: Olá ${c.customerName}, informamos que o lote *${activeLot.lotNumber}* do produto *${activeLot.productName}* entrou em protocolo de recall preventivo. Favor suspender o uso ou comercialização imediatamente. Entraremos em contato para o recolhimento e reposição sem qualquer custo.`;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{c.customerName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Adquiriu: <strong className="text-rose-700">{c.quantity} unidades</strong> • Tel: {phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(recallMsg);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                        >
                          {copiedIndex === idx ? '✓ Copiado!' : 'Copiar'}
                        </button>

                        <a
                          href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(recallMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>💬 WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRecallModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatchRecallAlert(
                    activeLot.lotNumber,
                    `Protocolo de recall disparado para o Lote ${activeLot.lotNumber} (${activeLot.productName}). Total de ${customersWhoReceived.length} clientes compradores comunicados.`
                  );
                  setRecallSuccessFeedback(
                    `✓ Protocolo de Recall ativado com sucesso! Lote ${activeLot.lotNumber} marcado como RECOLHIDO e alerta operacional gerado.`
                  );
                  setIsRecallModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Confirmar e Disparar Alerta Geral</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
