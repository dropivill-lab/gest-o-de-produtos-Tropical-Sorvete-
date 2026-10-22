import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  CreditCard,
  ArrowUpRight,
  Factory,
  UserX,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DailyRevenueChart } from './DailyRevenueChart';

interface DashboardViewProps {
  onOpenNewOrder?: () => void;
  onOpenNewProduction?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewOrder }) => {
  const { dashboardStats, setActiveView } = useApp();

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-12">
      {/* Cards Principais e Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Vendas do mês */}
        <div
          onClick={() => setActiveView('pedidos')}
          className="group relative p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">💰 Vendas do mês</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {formatCurrency(dashboardStats.monthlySales)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Faturamento consolidado
            </span>
            <span className="text-slate-400 group-hover:text-emerald-600 transition-colors font-medium">
              Ver vendas →
            </span>
          </div>
        </div>

        {/* Card 2: A receber */}
        <div
          onClick={() => setActiveView('receber')}
          className="group relative p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">💳 A receber</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {formatCurrency(dashboardStats.totalReceivables)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-amber-600 font-medium">Contas e prazos pendentes</span>
            <span className="text-slate-400 group-hover:text-amber-600 transition-colors font-medium">
              Cobrar clientes →
            </span>
          </div>
        </div>

        {/* Card 3: Lucro estimado */}
        <div
          onClick={() => setActiveView('relatorios')}
          className="group relative p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">📈 Lucro estimado</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight text-blue-600">
              {formatCurrency(dashboardStats.estimatedProfit)}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-blue-500 font-medium">Margem bruta deduzida</span>
            <span className="text-slate-400 group-hover:text-blue-600 transition-colors font-medium">
              Ver DRE →
            </span>
          </div>
        </div>

        {/* Card 4: Produtos em estoque */}
        <div
          onClick={() => setActiveView('estoque')}
          className="group relative p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">📦 Produtos em estoque</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {dashboardStats.totalProductsInStock}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">produtos</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-purple-600 font-medium">Itens com saldo ativo</span>
            <span className="text-slate-400 group-hover:text-purple-600 transition-colors font-medium">
              Gerenciar →
            </span>
          </div>
        </div>

        {/* Card 5: Produções do mês */}
        <div
          onClick={() => setActiveView('producao')}
          className="group relative p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">🏭 Produções do mês</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {dashboardStats.monthlyProductions}
              <span className="text-sm font-semibold text-slate-400 ml-1.5">bateladas</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-indigo-600 font-medium">Lotes rastreáveis gerados</span>
            <span className="text-slate-400 group-hover:text-indigo-600 transition-colors font-medium">
              Ver produção →
            </span>
          </div>
        </div>

        {/* Card 6: Inadimplentes */}
        <div
          onClick={() => setActiveView('receber')}
          className="group relative p-5 bg-white rounded-2xl border border-rose-200 shadow-xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer overflow-hidden bg-rose-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">🔴 Inadimplentes</span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {dashboardStats.delinquentCount}
              <span className="text-sm font-semibold text-rose-400 ml-1.5">clientes</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-medium">Cobrança pendente</span>
            <span className="text-rose-500 font-bold group-hover:underline">
              Cobrar WhatsApp →
            </span>
          </div>
        </div>

        {/* Card 7: Produtos próximos do vencimento */}
        <div
          onClick={() => setActiveView('estoque')}
          className="group relative p-5 bg-white rounded-2xl border border-amber-200 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer overflow-hidden bg-amber-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">
              ⚠️ Produtos próximos do vencimento
            </span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {dashboardStats.expiringSoonCount}
              <span className="text-sm font-semibold text-amber-500 ml-1.5">lotes/itens</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium">Requer atenção ou promoção</span>
            <span className="text-amber-700 font-bold group-hover:underline">
              Ver detalhes →
            </span>
          </div>
        </div>

        {/* Card 8: Atalho Consulta de Lote / Rastreabilidade */}
        <div
          onClick={() => setActiveView('rastreamento')}
          className="group relative p-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">🔍 Rastreabilidade</span>
              <div className="p-2.5 rounded-xl bg-slate-700 text-indigo-300">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-base font-bold text-white tracking-tight">
                Consulta de Lote
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Pesquise <code className="text-indigo-300 font-mono text-[11px]">ACA-07102026-01</code> para ver quem comprou
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
            <span className="text-indigo-300 font-medium">Histórico completo</span>
            <span className="text-slate-300 group-hover:text-white transition-colors font-medium">
              Rastrear agora →
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Faturamento por Dia */}
      <DailyRevenueChart onOpenNewOrder={onOpenNewOrder} />
    </div>
  );
};

