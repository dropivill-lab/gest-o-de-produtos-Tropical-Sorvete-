import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  CreditCard,
  QrCode,
  BarChart3,
  AlertTriangle,
  Settings,
  Factory,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeView,
    setActiveView,
    currentUserRole,
    setCurrentUserRole,
    settings,
    alerts,
    receivables,
  } = useApp();

  const urgentAlertsCount = alerts.filter((a) => !a.resolved && a.urgency === 'URGENTE').length;
  const overdueReceivablesCount = receivables.filter((r) => r.status === 'ATRASADO').length;

  // Role permissions filtering
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDEDOR'],
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Package,
      roles: ['ADMINISTRADOR', 'PRODUCAO'],
    },
    {
      id: 'producao',
      label: 'Produção',
      icon: Factory,
      roles: ['ADMINISTRADOR', 'PRODUCAO'],
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      icon: ShoppingCart,
      roles: ['ADMINISTRADOR', 'VENDEDOR'],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      roles: ['ADMINISTRADOR', 'FINANCEIRO', 'VENDEDOR'],
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      roles: ['ADMINISTRADOR', 'FINANCEIRO'],
    },
    {
      id: 'receber',
      label: 'Clientes a receber',
      icon: CreditCard,
      badge: overdueReceivablesCount > 0 ? `${overdueReceivablesCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white',
      roles: ['ADMINISTRADOR', 'FINANCEIRO'],
    },
    {
      id: 'rastreamento',
      label: 'Validade e rastreamento',
      icon: QrCode,
      roles: ['ADMINISTRADOR', 'PRODUCAO', 'VENDEDOR'],
    },
    {
      id: 'alertas',
      label: 'Alertas',
      icon: AlertTriangle,
      badge: urgentAlertsCount > 0 ? `${urgentAlertsCount}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
      roles: ['ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDEDOR'],
    },
    {
      id: 'anotacoes',
      label: 'Anotações',
      icon: StickyNote,
      roles: ['ADMINISTRADOR', 'FINANCEIRO', 'PRODUCAO', 'VENDEDOR'],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      roles: ['ADMINISTRADOR'],
    },
  ];

  const handleSelect = (id: string) => {
    setActiveView(id);
    setMobileOpen(false);
  };

  const roleColors: Record<UserRole, string> = {
    ADMINISTRADOR: 'bg-purple-100 text-purple-700 border-purple-200',
    FINANCEIRO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PRODUCAO: 'bg-amber-100 text-amber-700 border-amber-200',
    VENDEDOR: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo (matching "Sua Logo" in the PDF with custom logo support) */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800 bg-slate-950/40">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo da Empresa"
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-md border border-slate-700 shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30 font-bold shrink-0">
              <span className="text-xl">🍇</span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-white tracking-tight truncate">
              {settings.tradeName || 'Sua Logo'}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {settings.companyName.split(' ')[0] || 'Gestão Industrial'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Principal
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const isAllowed = item.roles.includes(currentUserRole);

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                disabled={!isAllowed}
                className={`group relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : isAllowed
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-500 cursor-not-allowed opacity-50'
                }`}
                title={!isAllowed ? `Restrito ao perfil: ${item.roles.join(', ')}` : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Profile & Role Selector */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Perfil
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                  roleColors[currentUserRole]
                }`}
              >
                {currentUserRole}
              </span>
            </div>

            <select
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
              className="w-full px-2 py-1.5 text-xs bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="PRODUCAO">Produção</option>
              <option value="VENDEDOR">Vendedor</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  );
};
