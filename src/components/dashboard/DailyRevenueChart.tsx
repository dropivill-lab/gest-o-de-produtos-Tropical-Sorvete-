import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  Zap,
  Banknote,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  ChevronRight,
  Filter,
  BarChart3,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

interface DayData {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "07/10"
  weekDayLabel: string; // e.g. "Ter"
  fullDateLabel: string; // e.g. "Terça-feira, 07 de Outubro"
  isToday: boolean;
  totalRevenue: number;
  orderCount: number;
  byPayment: {
    pix: number;
    cartao: number;
    dinheiro: number;
    aPrazo: number;
  };
  orders: Order[];
}

interface DailyRevenueChartProps {
  onOpenNewOrder?: () => void;
}

export const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({ onOpenNewOrder }) => {
  const { orders, setActiveView, isDemoMode } = useApp();
  const [period, setPeriod] = useState<'7d' | '14d' | '30d'>('7d');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Generate days dynamically based on current date
  const chartData = useMemo(() => {
    // Current date (October 19, 2026 or real current date)
    const baseDate = new Date();

    const numDays = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    const days: DayData[] = [];

    // Pre-calculate orders by date
    const ordersByDate = new Map<string, Order[]>();
    orders.forEach((order) => {
      const orderDate = order.createdAt ? order.createdAt.split(' ')[0] : '';
      if (orderDate) {
        const existing = ordersByDate.get(orderDate) || [];
        existing.push(order);
        ordersByDate.set(orderDate, existing);
      }
    });

    // Generate baseline pattern for demo mode
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const fullWeekDays = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayOrders = ordersByDate.get(dateStr) || [];
      const isToday = i === 0;

      // Calculate totals from orders in state
      let ordersTotal = 0;
      let pixTotal = 0;
      let cartaoTotal = 0;
      let dinheiroTotal = 0;
      let aPrazoTotal = 0;

      dayOrders.forEach((o) => {
        ordersTotal += o.totalAmount;
        if (o.paymentMethod === 'PIX') pixTotal += o.totalAmount;
        else if (o.paymentMethod === 'CARTAO') cartaoTotal += o.totalAmount;
        else if (o.paymentMethod === 'DINHEIRO') dinheiroTotal += o.totalAmount;
        else if (o.paymentMethod === 'A_PRAZO') aPrazoTotal += o.totalAmount;
      });

      // Synthetic demo value based on pseudo-random but stable seed
      const daySeed = (d.getDate() * 137 + d.getMonth() * 59) % 15;
      const baseVal = 700 + daySeed * 180;
      const demoVal = isDemoMode ? (dayOrders.length > 0 ? 0 : baseVal) : 0;
      const demoCount = isDemoMode ? (dayOrders.length > 0 ? 0 : Math.max(1, Math.floor(baseVal / 350))) : 0;

      const finalTotal = ordersTotal + demoVal;
      const finalCount = dayOrders.length + demoCount;

      const finalPix = pixTotal + (demoVal > 0 ? +(demoVal * 0.45).toFixed(2) : 0);
      const finalCartao = cartaoTotal + (demoVal > 0 ? +(demoVal * 0.35).toFixed(2) : 0);
      const finalDinheiro = dinheiroTotal + (demoVal > 0 ? +(demoVal * 0.15).toFixed(2) : 0);
      const finalAPrazo = aPrazoTotal + (demoVal > 0 ? +(demoVal * 0.05).toFixed(2) : 0);

      days.push({
        dateStr,
        dayLabel: `${day}/${month}`,
        weekDayLabel: weekDays[d.getDay()],
        fullDateLabel: `${fullWeekDays[d.getDay()]}, ${day} de ${months[d.getMonth()]}`,
        isToday,
        totalRevenue: finalTotal,
        orderCount: finalCount,
        byPayment: {
          pix: finalPix,
          cartao: finalCartao,
          dinheiro: finalDinheiro,
          aPrazo: finalAPrazo,
        },
        orders: dayOrders,
      });
    }

    return days;
  }, [orders, period, isDemoMode]);

  // Max value for scaling chart bars
  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.totalRevenue), 100);
    // Round up to nice number
    return Math.ceil(maxVal / 500) * 500;
  }, [chartData]);

  // Aggregate stats for current period
  const periodStats = useMemo(() => {
    const total = chartData.reduce((acc, d) => acc + d.totalRevenue, 0);
    const totalOrders = chartData.reduce((acc, d) => acc + d.orderCount, 0);
    const avgDaily = chartData.length > 0 ? total / chartData.length : 0;
    const ticketMedio = totalOrders > 0 ? total / totalOrders : 0;

    let bestDay = chartData[0];
    chartData.forEach((d) => {
      if (d.totalRevenue > (bestDay?.totalRevenue || 0)) {
        bestDay = d;
      }
    });

    const totalPix = chartData.reduce((acc, d) => acc + d.byPayment.pix, 0);
    const totalCartao = chartData.reduce((acc, d) => acc + d.byPayment.cartao, 0);
    const totalDinheiro = chartData.reduce((acc, d) => acc + d.byPayment.dinheiro, 0);
    const totalAPrazo = chartData.reduce((acc, d) => acc + d.byPayment.aPrazo, 0);

    return {
      total,
      totalOrders,
      avgDaily,
      ticketMedio,
      bestDay,
      payments: {
        pix: totalPix,
        cartao: totalCartao,
        dinheiro: totalDinheiro,
        aPrazo: totalAPrazo,
      },
    };
  }, [chartData]);

  // Default selected day is today or latest day
  const activeDay = useMemo(() => {
    const targetStr = hoveredDateStr || selectedDateStr;
    if (targetStr) {
      const found = chartData.find((d) => d.dateStr === targetStr);
      if (found) return found;
    }
    // Return today or last day
    return chartData[chartData.length - 1] || null;
  }, [chartData, hoveredDateStr, selectedDateStr]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header with Title and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Faturamento por Dia
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Tempo Real
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe a curva de vendas diárias, receitas por modalidade e picos de saída.
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Dias' },
            { id: '14d', label: '14 Dias' },
            { id: '30d', label: '30 Dias (Mês)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setPeriod(tab.id as any);
                setSelectedDateStr(null);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip for Current Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Faturamento do Período
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block tracking-tight">
            {formatCurrency(periodStats.total)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> {periodStats.totalOrders} pedidos realizados
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Média de Vendas / Dia
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-indigo-600 mt-1 block tracking-tight">
            {formatCurrency(periodStats.avgDaily)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Ritmo contínuo de caixa
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Melhor Dia de Vendas
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1 block tracking-tight">
            {periodStats.bestDay ? formatCurrency(periodStats.bestDay.totalRevenue) : 'R$ 0,00'}
          </span>
          <span className="text-[11px] text-slate-600 font-medium mt-1 block truncate">
            {periodStats.bestDay?.fullDateLabel.split(',')[0]} ({periodStats.bestDay?.dayLabel})
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ticket Médio
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1 block tracking-tight">
            {formatCurrency(periodStats.ticketMedio)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Por pedido faturado
          </span>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Interactive Bar Chart */}
        <div className="lg:col-span-8 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700">
                Evolução Diária ({chartData.length} dias)
              </span>
            </div>
            <div className="text-xs text-slate-500 hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Hoje / Destaque</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span>Dias Anteriores</span>
              </span>
            </div>
          </div>

          {/* Chart Canvas Area with separate Y-Axis Scale and smooth horizontal scroll */}
          <div className="flex gap-2 pt-4">
            {/* Dedicated Left Y-Axis Scale */}
            <div className="w-16 sm:w-20 shrink-0 flex flex-col justify-between text-right pr-2 text-[10px] text-slate-500 font-semibold h-52 sm:h-60 pb-8 pointer-events-none select-none border-r border-slate-200">
              <span className="truncate">{formatCurrency(maxRevenue)}</span>
              <span className="truncate">{formatCurrency(maxRevenue * 0.75)}</span>
              <span className="truncate">{formatCurrency(maxRevenue * 0.5)}</span>
              <span className="truncate">{formatCurrency(maxRevenue * 0.25)}</span>
              <span className="truncate text-slate-400">R$ 0,00</span>
            </div>

            {/* Scrollable Chart Body */}
            <div className="flex-1 relative overflow-x-auto pb-2">
              {/* Horizontal Grid lines */}
              <div
                className={`absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 ${
                  period === '7d' ? 'min-w-[420px]' : period === '14d' ? 'min-w-[650px]' : 'min-w-[950px]'
                }`}
              >
                <div className="border-b border-slate-200/60 w-full" />
                <div className="border-b border-slate-200/60 w-full" />
                <div className="border-b border-slate-200/60 w-full" />
                <div className="border-b border-slate-200/60 w-full" />
                <div className="border-b border-slate-300 w-full" />
              </div>

              {/* Bars Container */}
              <div
                className={`relative z-10 h-52 sm:h-60 flex items-end justify-between gap-1 sm:gap-2 px-1 ${
                  period === '7d' ? 'min-w-[420px]' : period === '14d' ? 'min-w-[650px]' : 'min-w-[950px]'
                }`}
              >
                {chartData.map((d) => {
                  const heightPercent = maxRevenue > 0 ? (d.totalRevenue / maxRevenue) * 100 : 0;
                  const isSelected = selectedDateStr === d.dateStr;
                  const isHovered = hoveredDateStr === d.dateStr;
                  const isActive = isSelected || isHovered;

                  return (
                    <div
                      key={d.dateStr}
                      onMouseEnter={() => setHoveredDateStr(d.dateStr)}
                      onMouseLeave={() => setHoveredDateStr(null)}
                      onClick={() => setSelectedDateStr(d.dateStr)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative min-w-[20px]"
                    >
                      {/* Tooltip on Hover/Selection */}
                      {isActive && (
                        <div className="absolute -top-12 z-30 pointer-events-none whitespace-nowrap bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <span>{d.dayLabel}:</span>
                          <span className="text-emerald-400">{formatCurrency(d.totalRevenue)}</span>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                        </div>
                      )}

                      {/* Bar */}
                      <div className="w-full max-w-[36px] flex flex-col justify-end h-full">
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 relative shadow-xs ${
                            d.isToday
                              ? isActive
                                ? 'bg-emerald-600 ring-2 ring-emerald-400 ring-offset-1'
                                : 'bg-gradient-to-t from-emerald-500 to-teal-400'
                              : isActive
                              ? 'bg-indigo-600 ring-2 ring-indigo-400 ring-offset-1'
                              : 'bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500'
                          }`}
                        >
                          {/* High Value Badge on Bar if applicable */}
                          {d.totalRevenue >= maxRevenue * 0.8 && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                        </div>
                      </div>

                      {/* X-Axis Label: prevent letter wrapping */}
                      <div className="mt-2 text-center w-full px-0.5 select-none">
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold block transition-colors leading-tight whitespace-nowrap ${
                            d.isToday
                              ? 'text-emerald-700 font-extrabold'
                              : isActive
                              ? 'text-indigo-700'
                              : 'text-slate-600 group-hover:text-slate-900'
                          }`}
                        >
                          {period === '30d' ? d.dayLabel.split('/')[0] : d.dayLabel}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold whitespace-nowrap">
                          {d.isToday ? 'Hoje' : d.weekDayLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span className="italic text-[11px] text-indigo-600 font-medium">
              {period === '30d'
                ? '↔ Deslize para navegar pelos 30 dias do mês. Clique em qualquer dia para inspecionar.'
                : period === '14d'
                ? '↔ Deslize se necessário. Clique em qualquer dia para inspecionar os detalhes.'
                : '* Clique em qualquer barra para inspecionar os detalhes e pedidos do dia.'}
            </span>
            <span className="text-[11px] font-semibold text-slate-600">
              Escala máxima: {formatCurrency(maxRevenue)}
            </span>
          </div>
        </div>

        {/* Selected / Hovered Day Inspection Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {activeDay ? (
            <>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {activeDay.isToday ? 'Hoje (Em andamento)' : 'Dia Selecionado'}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                    {activeDay.fullDateLabel}
                  </h4>
                </div>
                <span className="px-2.5 py-1 text-xs font-extrabold bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  {formatCurrency(activeDay.totalRevenue)}
                </span>
              </div>

              {/* Day Breakdown by Payment Method */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Distribuição por Forma de Pagamento:
                </span>

                {/* Pix */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Pix</span>
                      <span className="text-[10px] text-slate-400">À vista / imediato</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(activeDay.byPayment.pix)}
                  </span>
                </div>

                {/* Cartão */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Cartão</span>
                      <span className="text-[10px] text-slate-400">Débito / Crédito</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(activeDay.byPayment.cartao)}
                  </span>
                </div>

                {/* Dinheiro */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Dinheiro</span>
                      <span className="text-[10px] text-slate-400">Em espécie</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(activeDay.byPayment.dinheiro)}
                  </span>
                </div>

                {/* A Prazo */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">A Prazo</span>
                      <span className="text-[10px] text-slate-400">Faturado para receber</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(activeDay.byPayment.aPrazo)}
                  </span>
                </div>
              </div>

              {/* Day Orders list if any */}
              {activeDay.orders.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Pedidos Registrados no ERP ({activeDay.orders.length}):
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeDay.orders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => setActiveView('pedidos')}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{o.orderNumber}</span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[140px]">
                            {o.customerName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-600 block">
                            {formatCurrency(o.totalAmount)}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase">
                            {o.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setActiveView('pedidos')}
                  className="flex-1 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Ver em Pedidos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {onOpenNewOrder && (
                  <button
                    onClick={onOpenNewOrder}
                    className="py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>+ Novo Pedido</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Selecione um dia para ver os detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
