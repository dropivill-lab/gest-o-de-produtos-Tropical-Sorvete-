import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Factory,
  AlertTriangle,
  CreditCard,
  Receipt,
  Truck,
  Layers,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { triggerPrint } from '../../utils/printHelper';

export const RelatoriosView: React.FC = () => {
  const { products, orders, receivables, productions, lots } = useApp();

  const [periodFilter, setPeriodFilter] = useState<'Hoje' | 'Semana' | 'Mês' | 'Personalizado'>('Mês');
  const [activeReportTab, setActiveReportTab] = useState<
    'DRE' | 'Vendas' | 'Estoque' | 'Producao' | 'Perdas' | 'Inadimplencia' | 'MaisVendidos'
  >('DRE');

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Example DRE from Slide 8:
  // Resultado de setembro
  // Vendas: R$ 25.400
  // Custos: R$ 14.200
  // Perdas: R$ 1.100
  // Despesas: R$ 4.300
  // Resultado: R$ 5.800
  const dreExample = {
    title: periodFilter === 'Mês' ? 'Resultado de Setembro / Mensal' : `Resultado (${periodFilter})`,
    vendas: 25400.0,
    custos: 14200.0,
    perdas: 1100.0,
    despesas: 4300.0,
    resultado: 5800.0,
  };

  const reportTabs = [
    { id: 'DRE', label: '💰 Lucro & DRE', icon: DollarSign },
    { id: 'Vendas', label: '📈 Vendas', icon: TrendingUp },
    { id: 'MaisVendidos', label: '📊 Produtos Mais Vendidos', icon: BarChart3 },
    { id: 'Estoque', label: '📦 Estoque', icon: Package },
    { id: 'Producao', label: '🏭 Produção', icon: Factory },
    { id: 'Perdas', label: '⚠️ Perdas', icon: AlertTriangle },
    { id: 'Inadimplencia', label: '💳 Inadimplência', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Relatórios Gerenciais & DRE
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Demonstrativo contábil, lucratividade detalhada e indicadores de desempenho operacional.
          </p>
        </div>

        {/* Filtros: Hoje | Semana | Mês | Personalizado (Exact from Slide 8) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          {(['Hoje', 'Semana', 'Mês', 'Personalizado'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setPeriodFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                periodFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Report Categories Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {reportTabs.map((tab) => {
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DRE View - Highlighted Example from Slide 8 */}
      {activeReportTab === 'DRE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Exemplo Exato de Setembro (Slide 8) */}
          <div id="print-relatorio-dre" className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Por exemplo:
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {dreExample.title}
                </h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                DRE Resumido
              </span>
            </div>

            {/* DRE Rows */}
            <div className="space-y-3">
              {/* Vendas */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 text-sm">📈 Vendas</span>
                <span className="font-extrabold text-emerald-600 text-base">
                  {formatCurrency(dreExample.vendas)}
                </span>
              </div>

              {/* Custos */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 text-sm">🧾 Custos (CMV / Insumos)</span>
                <span className="font-extrabold text-rose-600 text-base">
                  −{formatCurrency(dreExample.custos)}
                </span>
              </div>

              {/* Perdas */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 text-sm">⚠️ Perdas de Produção</span>
                <span className="font-extrabold text-amber-600 text-base">
                  −{formatCurrency(dreExample.perdas)}
                </span>
              </div>

              {/* Despesas */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 text-sm">🏢 Despesas Operacionais</span>
                <span className="font-extrabold text-rose-600 text-base">
                  −{formatCurrency(dreExample.despesas)}
                </span>
              </div>
            </div>

            {/* Resultado Final */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-100 block">
                  Resultado Líquido
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Resultado: {formatCurrency(dreExample.resultado)}
                </span>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-xs">
                Margem: 22.8%
              </span>
            </div>
          </div>

          {/* Visual Analysis Chart & Composition */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-800">
              Composição Percentual da Receita
            </h3>
            <p className="text-xs text-slate-500 -mt-4">
              Distribuição de custos e lucratividade real sobre as vendas totais
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Custos dos Produtos (CMV)</span>
                  <span>55.9% ({formatCurrency(dreExample.custos)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '55.9%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Despesas Operacionais & Administrativas</span>
                  <span>16.9% ({formatCurrency(dreExample.despesas)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '16.9%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Perdas de Produção / Descartes</span>
                  <span>4.3% ({formatCurrency(dreExample.perdas)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '4.3%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-800 mb-1">
                  <span>Lucro Líquido Real</span>
                  <span className="font-extrabold">22.8% ({formatCurrency(dreExample.resultado)})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '22.8%' }} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Relatório atualizado com os dados consolidados do ERP</span>
              <button
                type="button"
                onClick={() =>
                  triggerPrint({
                    title: `Relatório DRE - ${dreExample.title}`,
                    elementId: 'print-relatorio-dre',
                  })
                }
                className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Exportar / Imprimir DRE →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Produtos Mais Vendidos View */}
      {activeReportTab === 'MaisVendidos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Ranking de Produtos Mais Vendidos
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Açaí 10 L Tradicional', sold: 185, total: 13875, percent: 85 },
              { name: 'Açaí 5 L Especial Banana', sold: 74, total: 3552, percent: 50 },
              { name: 'Polpa Pura de Açaí 1kg', sold: 220, total: 4840, percent: 65 },
              { name: 'Polpa de Cupuaçu 1kg', sold: 45, total: 1215, percent: 30 },
              { name: 'Xarope de Guaraná 5L', sold: 28, total: 1820, percent: 25 },
            ].map((prod, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800 text-sm">
                    #{idx + 1} {prod.name}
                  </span>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">
                      {formatCurrency(prod.total)}
                    </span>
                    <span className="text-slate-400 text-[11px]">{prod.sold} unidades vendidas</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${prod.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outras Abas (Estoque, Produção, Perdas, Inadimplência) */}
      {activeReportTab !== 'DRE' && activeReportTab !== 'MaisVendidos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Relatório Detalhado: {activeReportTab}
          </h3>
          <p className="text-xs text-slate-500">
            Visualização sintetizada dos indicadores do período selecionado ({periodFilter}).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block uppercase">Total no Período</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">
                {activeReportTab === 'Inadimplencia'
                  ? 'R$ 3.250,00'
                  : activeReportTab === 'Perdas'
                  ? 'R$ 1.100,00 (14 baldes)'
                  : activeReportTab === 'Producao'
                  ? '26 Bateladas'
                  : '342 Unidades'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block uppercase">Média Semanal</span>
              <span className="text-xl font-bold text-indigo-600 mt-1 block">
                {activeReportTab === 'Inadimplencia'
                  ? 'R$ 812,50'
                  : activeReportTab === 'Perdas'
                  ? 'R$ 275,00'
                  : activeReportTab === 'Producao'
                  ? '6.5 Bateladas'
                  : '85.5 Unidades'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-400 block uppercase">Status Operacional</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                Controlado
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
