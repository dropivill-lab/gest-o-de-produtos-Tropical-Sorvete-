import React, { useState } from 'react';
import {
  Menu,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewOrder?: () => void;
  onOpenNewProduction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
}) => {
  const {
    activeView,
    setActiveView,
    alerts,
    resolveAlert,
    settings,
  } = useApp();
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Geral',
      subtitle: 'Visão consolidada de vendas, estoque, finanças e operações',
    },
    estoque: {
      title: 'Controle de Estoque & Lotes',
      subtitle: 'Gerenciamento detalhado de produtos, validades e custos por lote',
    },
    producao: {
      title: 'Controle de Produção',
      subtitle: 'Registro de bateladas, ingredientes, perdas e geração de lotes',
    },
    pedidos: {
      title: 'Pedidos & Vendas',
      subtitle: 'Emissão ágil de pedidos com atualização automática e limites de crédito',
    },
    clientes: {
      title: 'Ficha de Clientes',
      subtitle: 'Histórico de compras, limites de crédito e acompanhamento financeiro',
    },
    financeiro: {
      title: 'Fluxo Financeiro',
      subtitle: 'Separação total de receitas, despesas, fornecedores e resultado líquido',
    },
    receber: {
      title: 'Clientes a Receber & Cobrança',
      subtitle: 'Controle direto de inadimplência e envio de mensagens prontas via WhatsApp',
    },
    rastreamento: {
      title: 'Validade & Rastreabilidade de Lotes',
      subtitle: 'Rastreamento completo do lote da matéria-prima até os clientes finais',
    },
    relatorios: {
      title: 'Relatórios Gerenciais',
      subtitle: 'DRE do período, vendas, lucratividade, perdas e produtos mais vendidos',
    },
    alertas: {
      title: 'Central de Alertas & Notificações',
      subtitle: 'Alertas urgentes, de atenção e informativos gerados pelo sistema',
    },
    anotacoes: {
      title: 'Bloco de Anotações',
      subtitle: 'Recados, lembretes de turno e observações operacionais',
    },
    configuracoes: {
      title: 'Configurações do Sistema',
      subtitle: 'Dados da empresa, logotipo, regras automáticas e parâmetros gerais',
    },
  };

  const currentViewInfo = viewTitles[activeView] || {
    title: 'GestãoPro',
    subtitle: 'Sistema Integrado',
  };

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const urgentCount = activeAlerts.filter((a) => a.urgency === 'URGENTE').length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left section: Hamburger button, Company Logo & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 rounded-xl hover:bg-slate-100 lg:hidden focus:outline-hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo e Nome da Empresa no Menu Superior */}
        <div className="flex items-center gap-2.5 shrink-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.tradeName || settings.companyName || 'Logo'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-base shadow-xs shrink-0">
              🍇
            </div>
          )}
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight truncate leading-tight">
              {settings.tradeName || 'Sua Logo'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate leading-none">
              {settings.companyName || 'Indústria & Distribuição'}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 tracking-tight truncate">
            {currentViewInfo.title}
          </h1>
          <p className="text-xs text-slate-500 hidden md:block truncate max-w-md">
            {currentViewInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right section: Notification Bell */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Alerts Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
            className="relative p-2 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors focus:outline-hidden"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Modal / Popover */}
          {alertsDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setAlertsDropdownOpen(false)}
              />
              <div className="absolute right-0 z-40 w-80 sm:w-96 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Alertas do Sistema</span>
                    {urgentCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
                        {urgentCount} urgentes
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setAlertsDropdownOpen(false);
                      setActiveView('alertas');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {activeAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhum alerta pendente no momento!
                    </div>
                  ) : (
                    activeAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                          alert.urgency === 'URGENTE'
                            ? 'bg-rose-50/40'
                            : alert.urgency === 'ATENCAO'
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {alert.urgency === 'URGENTE' ? (
                              <span className="text-sm">🔴</span>
                            ) : alert.urgency === 'ATENCAO' ? (
                              <span className="text-sm">🟡</span>
                            ) : (
                              <span className="text-sm">🔵</span>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">{alert.title}</p>
                              <p className="text-slate-600 mt-0.5 leading-relaxed">
                                {alert.description}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600"
                            title="Marcar como resolvido"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setAlertsDropdownOpen(false);
                      setActiveView('alertas');
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-indigo-600"
                  >
                    Acessar Central de Alertas Completa →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
