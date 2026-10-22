import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldAlert,
  BellRing,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AlertCategory, AlertUrgency, SystemAlert } from '../../types';

export const AlertasView: React.FC = () => {
  const { alerts, resolveAlert, setActiveView } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('TODOS');

  const filterOptions = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'URGENTES', label: 'Urgentes' },
    { id: 'ESTOQUE', label: 'Estoque' },
    { id: 'FINANCEIRO', label: 'Financeiro' },
    { id: 'PRODUCAO', label: 'Produção' },
    { id: 'VALIDADE', label: 'Validade' },
    { id: 'CLIENTES', label: 'Clientes' },
  ];

  const handleFilterClick = (id: string) => {
    if (id === 'URGENTES') {
      setUrgencyFilter('URGENTE');
      setCategoryFilter('TODOS');
    } else if (id === 'TODOS') {
      setUrgencyFilter('TODOS');
      setCategoryFilter('TODOS');
    } else {
      setCategoryFilter(id);
      setUrgencyFilter('TODOS');
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (urgencyFilter === 'URGENTE' && alert.urgency !== 'URGENTE') return false;
    if (categoryFilter !== 'TODOS' && alert.category !== categoryFilter) return false;
    return true;
  });

  const urgentAlerts = filteredAlerts.filter((a) => a.urgency === 'URGENTE');
  const warningAlerts = filteredAlerts.filter((a) => a.urgency === 'ATENCAO');
  const infoAlerts = filteredAlerts.filter((a) => a.urgency === 'INFORMATIVO');

  const handleAction = (alert: SystemAlert) => {
    if (alert.actionTarget) {
      setActiveView(alert.actionTarget);
    }
    resolveAlert(alert.id);
  };

  const renderAlertCard = (alert: SystemAlert, typeColor: string, iconSymbol: string) => {
    return (
      <div
        key={alert.id}
        className={`p-4 rounded-2xl border transition-all ${
          alert.resolved
            ? 'bg-slate-50 border-slate-200 opacity-60'
            : typeColor
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-lg shrink-0 mt-0.5">{iconSymbol}</span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200">
                {alert.category}
              </span>
              {alert.resolved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Resolvido
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {alert.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {!alert.resolved && (
            <>
              {alert.actionText && (
                <button
                  onClick={() => handleAction(alert)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{alert.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => resolveAlert(alert.id)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="Marcar como resolvido"
              >
                <Check className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BellRing className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Central de Alertas & Notificações Operacionais
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gera avisos proativos sobre estoque baixo, validades, atrasos de pagamento e eventos de produção.
          </p>
        </div>
      </div>

      {/* Filtros da tela (Slide 9):
          Todos | Urgentes | Estoque | Financeiro | Produção | Validade | Clientes */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Filtros:
        </span>
        {filterOptions.map((opt) => {
          const isSelected =
            (opt.id === 'URGENTES' && urgencyFilter === 'URGENTE') ||
            (opt.id === 'TODOS' && urgencyFilter === 'TODOS' && categoryFilter === 'TODOS') ||
            (categoryFilter === opt.id);

          return (
            <button
              key={opt.id}
              onClick={() => handleFilterClick(opt.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Se não houver alertas */}
      {filteredAlerts.length === 0 && (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
          <span className="text-3xl">✨</span>
          <h4 className="font-bold text-slate-800 text-base">Tudo sob controle!</h4>
          <p className="text-xs text-slate-500">
            Nenhum alerta ou pendência pendente no momento. O sistema avisará automaticamente sobre vencimentos, estoque baixo ou pagamentos em atraso.
          </p>
        </div>
      )}

      {/* 🔴 Alertas Urgentes (Exact from Slide 9) */}
      {(urgencyFilter === 'TODOS' || urgencyFilter === 'URGENTE') && urgentAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔴</span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Alertas urgentes ({urgentAlerts.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {urgentAlerts.map((a) =>
              renderAlertCard(a, 'bg-rose-50/60 border-rose-200/90', '🔴')
            )}
          </div>
        </div>
      )}

      {/* 🟡 Alertas de Atenção (Exact from Slide 9) */}
      {urgencyFilter === 'TODOS' && warningAlerts.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🟡</span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Alertas de atenção ({warningAlerts.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {warningAlerts.map((a) =>
              renderAlertCard(a, 'bg-amber-50/60 border-amber-200/90', '🟡')
            )}
          </div>
        </div>
      )}

      {/* 🔵 Alertas Informativos (Exact from Slide 9) */}
      {urgencyFilter === 'TODOS' && infoAlerts.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔵</span>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
              Alertas informativos ({infoAlerts.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {infoAlerts.map((a) =>
              renderAlertCard(a, 'bg-blue-50/50 border-blue-200/80', '🔵')
            )}
          </div>
        </div>
      )}
    </div>
  );
};
