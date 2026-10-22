import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  DollarSign,
  QrCode,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Printer,
  Sparkles,
  ChevronDown,
  Clock,
  Trash2,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Order, Product } from '../../types';
import { Modal } from '../common/Modal';
import { triggerPrint, downloadPrintableFile } from '../../utils/printHelper';

interface PedidosViewProps {
  isModalOpenInitially?: boolean;
  onCloseInitialModal?: () => void;
}

export interface DraftOrderItem {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  unit: string;
  lotNumber: string;
  quantity: number;
  unitPrice: number;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  isModalOpenInitially = false,
  onCloseInitialModal,
}) => {
  const {
    orders,
    customers,
    products,
    lots,
    settings,
    createOrder,
    darBaixaPedido,
    setActiveView,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(isModalOpenInitially);
  const [search, setSearch] = useState('');
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<Order | null>(null);

  // New Order Form state: Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');

  // Products on the customer's note (multiple products supported)
  const [orderItems, setOrderItems] = useState<DraftOrderItem[]>(() => {
    const defaultProduct = products[0];
    const defaultLot = lots.find((l) => l.productId === defaultProduct?.id && l.quantity > 0) || lots[0];
    if (defaultProduct && defaultLot) {
      return [
        {
          id: `item-${Date.now()}-1`,
          productId: defaultProduct.id,
          productCode: defaultProduct.code,
          productName: defaultProduct.name,
          unit: defaultProduct.unit,
          lotNumber: defaultLot.lotNumber,
          quantity: Math.min(2, defaultLot.quantity > 0 ? defaultLot.quantity : 1),
          unitPrice: defaultLot.unitPrice,
        },
      ];
    }
    return [];
  });

  // Controls for adding another product to the note
  const [addingProductId, setAddingProductId] = useState('');
  const [addingProductQuery, setAddingProductQuery] = useState('');
  const [isAddingDropdownOpen, setIsAddingDropdownOpen] = useState(false);
  const [addingLotNumber, setAddingLotNumber] = useState('');
  const [addingQuantity, setAddingQuantity] = useState(1);
  const [addingUnitPrice, setAddingUnitPrice] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('A_PRAZO');
  const [darBaixaImediata, setDarBaixaImediata] = useState(false);
  const [dueDate, setDueDate] = useState('2026-10-14');
  const [notes, setNotes] = useState('Pedido padrão de açaí');
  const [overrideCreditLimit, setOverrideCreditLimit] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Discount state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showDiscountInput, setShowDiscountInput] = useState<boolean>(false);

  // Baixa confirmation modal state with partial/total payment
  const [orderToBaixa, setOrderToBaixa] = useState<Order | null>(null);
  const [baixaAmountInput, setBaixaAmountInput] = useState<number>(0);
  const [baixaSuccessFeedback, setBaixaSuccessFeedback] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Selected customer details
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const availableCredit = currentCustomer
    ? Math.max(0, currentCustomer.creditLimit - currentCustomer.openBalance)
    : 0;

  // Order totals from all products currently in the note with discount
  const subtotalAmount = orderItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const totalItemsCount = orderItems.reduce((acc, i) => acc + i.quantity, 0);
  const effectiveDiscount = Math.min(subtotalAmount, Math.max(0, discountAmount || 0));
  const baseAfterDiscount = Math.max(0, subtotalAmount - effectiveDiscount);

  // Na taxa da maquininha a taxa é responsabilidade do cliente, portanto é SOMADA ao valor pago pelo cliente
  const cardFeeAmount = +(baseAfterDiscount * (settings.defaultCardFee / 100)).toFixed(2);
  const totalAmount = paymentMethod === 'CARTAO' ? +(baseAfterDiscount + cardFeeAmount).toFixed(2) : baseAfterDiscount;
  const cardNetAmount = baseAfterDiscount; // Valor que a empresa efetivamente recebe

  // Credit limit warning
  const exceedsCredit =
    paymentMethod === 'A_PRAZO' && currentCustomer && totalAmount > availableCredit;
  const isDelinquent =
    paymentMethod === 'A_PRAZO' && currentCustomer && currentCustomer.daysOverdue > 0;

  // Autocomplete matching for adding another product
  const matchingAddingProducts = products.filter((p) => {
    const q = addingProductQuery.trim().toLowerCase();
    if (!q) return true;
    const matchName = p.name.toLowerCase().includes(q);
    const matchCode = p.code ? p.code.toLowerCase().includes(q) : false;
    const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
    return matchName || matchCode || matchBarcode;
  });

  const selectedAddingProduct = products.find((p) => p.id === addingProductId);
  const availableLotsForAddingProduct = lots.filter(
    (l) => l.productId === addingProductId && l.quantity > 0
  );

  const handleSelectProductToAdd = (p: Product) => {
    setAddingProductId(p.id);
    setAddingProductQuery(`${p.code ? `[${p.code}] ` : ''}${p.name}`);
    setIsAddingDropdownOpen(false);
    const pLots = lots.filter((l) => l.productId === p.id && l.quantity > 0);
    if (pLots.length > 0) {
      setAddingLotNumber(pLots[0].lotNumber);
      setAddingUnitPrice(pLots[0].unitPrice);
      setAddingQuantity(1);
    } else {
      setAddingLotNumber('');
      setAddingUnitPrice(0);
    }
  };

  const handleAddItemToNote = () => {
    if (!addingProductId) {
      setFeedbackError('Selecione um produto para adicionar à nota.');
      return;
    }
    const prod = products.find((p) => p.id === addingProductId);
    if (!prod) return;
    if (!addingLotNumber) {
      setFeedbackError(`O produto ${prod.name} não possui lote com estoque disponível.`);
      return;
    }
    const lot = lots.find((l) => l.lotNumber === addingLotNumber);
    if (!lot) {
      setFeedbackError('Lote selecionado inválido.');
      return;
    }
    if (addingQuantity <= 0) {
      setFeedbackError('A quantidade deve ser de no mínimo 1.');
      return;
    }
    if (lot.quantity < addingQuantity) {
      setFeedbackError(`Estoque insuficiente no lote ${lot.lotNumber}. Disponível: ${lot.quantity} un.`);
      return;
    }

    // Check if same product & lot is already in the note
    const existingIndex = orderItems.findIndex(
      (i) => i.productId === addingProductId && i.lotNumber === addingLotNumber
    );

    if (existingIndex >= 0) {
      setOrderItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + addingQuantity }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          unit: prod.unit,
          lotNumber: addingLotNumber,
          quantity: addingQuantity,
          unitPrice: addingUnitPrice || lot.unitPrice,
        },
      ]);
    }

    // Reset adder inputs
    setAddingProductId('');
    setAddingProductQuery('');
    setAddingLotNumber('');
    setAddingQuantity(1);
    setAddingUnitPrice(0);
    setFeedbackError(null);
  };

  const handleRemoveItemFromNote = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItemFromNote(id);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const lot = lots.find((l) => l.lotNumber === item.lotNumber);
          const maxAvailable = lot ? lot.quantity : newQty;
          return { ...item, quantity: Math.min(newQty, maxAvailable) };
        }
        return item;
      })
    );
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: Math.max(0, newPrice) } : item))
    );
  };

  const handleUpdateItemLot = (id: string, lotNum: string) => {
    const lot = lots.find((l) => l.lotNumber === lotNum);
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            lotNumber: lotNum,
            unitPrice: lot ? lot.unitPrice : item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const handleConfirmBaixa = (order: Order) => {
    const curRemaining = order.remainingAmount !== undefined ? order.remainingAmount : (order.totalAmount - (order.paidAmount || 0));
    const amount = baixaAmountInput > 0 ? baixaAmountInput : curRemaining;
    darBaixaPedido(order.id, amount);
    const isFull = amount >= curRemaining;
    setBaixaSuccessFeedback(
      `✓ ${isFull ? 'Baixa total' : 'Baixa parcial'} confirmada no Pedido ${order.orderNumber} (${formatCurrency(amount)})!`
    );
    setOrderToBaixa(null);
    setTimeout(() => {
      setBaixaSuccessFeedback(null);
    }, 4000);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (orderItems.length === 0) {
      setFeedbackError('Adicione pelo menos um produto à nota antes de confirmar o pedido.');
      return;
    }

    const res = createOrder({
      customerId: selectedCustomerId,
      items: orderItems.map((item) => ({
        productId: item.productId,
        productCode: item.productCode,
        lotNumber: item.lotNumber,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      paymentMethod,
      darBaixaImediata: paymentMethod === 'A_PRAZO' ? false : darBaixaImediata,
      dueDate: paymentMethod === 'A_PRAZO' ? dueDate : undefined,
      notes,
      discountAmount: effectiveDiscount,
      overrideCreditLimit,
    });

    if (!res.success) {
      setFeedbackError(res.message);
    } else {
      setFeedbackSuccess(res.message);
      if (res.order) {
        setSelectedOrderReceipt(res.order);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        if (onCloseInitialModal) onCloseInitialModal();
        setFeedbackSuccess(null);
      }, 1200);
    }
  };

  const filteredOrders = orders.filter((o) => {
    return (
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Gestão de Pedidos & Faturamento
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cada novo pedido atualiza instantaneamente estoque, contas a receber, caixa e histórico do cliente.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedbackError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>+ Novo Pedido</span>
        </button>
      </div>

      {/* Baixa Success Feedback Banner */}
      {baixaSuccessFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{baixaSuccessFeedback}</span>
        </div>
      )}

      {/* Orders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="text-xs text-slate-500">
            Exibindo <strong>{filteredOrders.length}</strong> pedidos registrados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Pedido / Data</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Itens / Lote</th>
                <th className="py-3 px-4">Forma de Pagamento</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="w-8 h-8 text-slate-300" />
                      <strong className="text-slate-700 font-bold">Nenhum pedido emitido ainda.</strong>
                      <span className="text-slate-400">Clique em "+ Novo Pedido" para realizar sua primeira venda.</span>
                      <button
                        onClick={() => {
                          setFeedbackError(null);
                          setIsModalOpen(true);
                        }}
                        className="mt-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                      >
                        + Emitir Primeiro Pedido
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">{order.createdAt}</span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div>{order.customerName}</div>
                    {order.customerPhone && (
                      <span className="text-[11px] text-slate-400">{order.customerPhone}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="font-medium text-slate-800">
                          {item.quantity}x {item.productName}
                        </span>
                        <div className="text-[11px] font-mono text-indigo-600">
                          Lote: {item.lotNumber}
                        </div>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {order.paymentMethod === 'A_PRAZO' ? 'A Prazo' : order.paymentMethod}
                      </span>
                    </div>
                    {order.paymentMethod === 'CARTAO' && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Líquido: {formatCurrency(order.netAmount)} (-{order.cardFeePercentage}%)
                      </span>
                    )}
                    {order.paymentMethod === 'A_PRAZO' && order.dueDate && (
                      <span className="text-[11px] text-amber-700 font-medium block mt-0.5">
                        Vence: {order.dueDate.split('-').reverse().join('/')}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="font-extrabold text-slate-900 text-sm block">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    {order.paidAmount && order.paidAmount > 0 && order.paymentStatus !== 'PAGO' && (
                      <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
                        Restante: {formatCurrency(order.remainingAmount !== undefined ? order.remainingAmount : (order.totalAmount - order.paidAmount))}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'PAGO'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : order.paymentStatus === 'ATRASADO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.paymentStatus !== 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToBaixa(order);
                            const rem = order.remainingAmount !== undefined ? order.remainingAmount : (order.totalAmount - (order.paidAmount || 0));
                            setBaixaAmountInput(rem);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                          title="Dar baixa no pagamento e liquidar no caixa"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dar Baixa</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderReceipt(order)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                      >
                        Ver Comprovante
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: + Novo Pedido (Exact Interactive Layout from Slide 3) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseInitialModal) onCloseInitialModal();
        }}
        title="+ Novo Pedido"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Cliente
              </label>
              {currentCustomer && (
                <span className="text-[11px] text-slate-500">
                  Limite: <strong>{formatCurrency(currentCustomer.creditLimit)}</strong> | Em aberto:{' '}
                  <strong className={currentCustomer.openBalance > 0 ? 'text-amber-600' : ''}>
                    {formatCurrency(currentCustomer.openBalance)}
                  </strong>{' '}
                  | Disp:{' '}
                  <strong className="text-emerald-700">{formatCurrency(availableCredit)}</strong>
                </span>
              )}
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.daysOverdue > 0 ? `(🔴 ${c.daysOverdue} dias em atraso)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seção: Produtos da Nota (Multi-produtos com rastreabilidade) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <label className="text-xs font-bold text-slate-800">
                  Produtos da Nota Fiscal / Pedido ({orderItems.length} {orderItems.length === 1 ? 'produto' : 'produtos'})
                </label>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                Subtotal: {formatCurrency(totalAmount)} ({totalItemsCount} un)
              </span>
            </div>

            {/* Lista dos Produtos já adicionados na nota */}
            {orderItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                Nenhum produto adicionado à nota ainda. Selecione e adicione um produto abaixo.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {orderItems.map((item) => {
                  const itemLots = lots.filter((l) => l.productId === item.productId && l.quantity > 0);
                  const currentLot = lots.find((l) => l.lotNumber === item.lotNumber);
                  const maxQty = currentLot ? currentLot.quantity : 999;
                  const itemTotal = item.quantity * item.unitPrice;

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl shadow-2xs space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {item.productCode || 'S/C'}
                          </span>
                          <span className="font-bold text-xs text-slate-800 truncate">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({item.unit})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold text-indigo-700">
                            {formatCurrency(itemTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromNote(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover produto da nota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Controles do item: Lote, Quantidade, Preço Unitário */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs pt-1 border-t border-slate-100">
                        {/* Lote */}
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Lote em Estoque:
                          </label>
                          <select
                            value={item.lotNumber}
                            onChange={(e) => handleUpdateItemLot(item.id, e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:border-indigo-500"
                          >
                            {itemLots.length === 0 ? (
                              <option value={item.lotNumber}>{item.lotNumber} (Sem estoque adicional)</option>
                            ) : (
                              itemLots.map((l) => (
                                <option key={l.id} value={l.lotNumber}>
                                  {l.lotNumber} ({l.quantity} un disp.)
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Quantidade */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Quantidade:
                          </label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-l-lg font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={maxQty}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.id, Number(e.target.value))}
                              className="w-full text-center py-1 text-xs bg-slate-50 border-y border-slate-200 font-bold focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= maxQty}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-r-lg font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Preço Unitário */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Preço Unit. (R$):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItemPrice(item.id, Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-right focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Painel para Adicionar Outro Produto à Nota (Permite adicionar produtos diferentes) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-indigo-100/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Adicionar Outro Produto à Nota</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Selecione produtos diferentes do catálogo para incluir na mesma nota
                  </p>
                </div>

                {/* Sugestões Rápidas de produtos do catálogo */}
                <div className="flex flex-wrap items-center gap-1">
                  {products.slice(0, 4).map((p) => {
                    const alreadyInNote = orderItems.some((i) => i.productId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProductToAdd(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          addingProductId === p.id
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : alreadyInNote
                            ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-medium'
                        }`}
                        title={alreadyInNote ? 'Produto já na nota (clique para adicionar outro lote ou mais)' : 'Adicionar este produto'}
                      >
                        + {p.name} {alreadyInNote && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Busca e Seleção de Produto */}
                <div className="sm:col-span-5 relative">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Produto (Busca por nome ou código)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pesquise outro produto (ex: Açaí 5L, Polpa...)"
                      value={addingProductQuery}
                      onFocus={() => setIsAddingDropdownOpen(true)}
                      onChange={(e) => {
                        setAddingProductQuery(e.target.value);
                        setIsAddingDropdownOpen(true);
                      }}
                      className="w-full pl-7 pr-6 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium focus:border-indigo-500 focus:outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {addingProductQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingProductQuery('');
                          setAddingProductId('');
                          setIsAddingDropdownOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown de produtos encontrados */}
                  {isAddingDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsAddingDropdownOpen(false)}
                      />
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                        {matchingAddingProducts.length === 0 ? (
                          <div className="p-2.5 text-center text-xs text-slate-500">
                            Nenhum produto encontrado.
                          </div>
                        ) : (
                          matchingAddingProducts.map((p) => {
                            const pLots = lots.filter((l) => l.productId === p.id && l.quantity > 0);
                            const totalStock = pLots.reduce((acc, l) => acc + l.quantity, 0);
                            const isAlreadyInNote = orderItems.some((i) => i.productId === p.id);

                            return (
                              <div
                                key={p.id}
                                onClick={() => handleSelectProductToAdd(p)}
                                className={`p-2 flex items-center justify-between cursor-pointer text-xs transition-colors hover:bg-indigo-50/70 ${
                                  addingProductId === p.id ? 'bg-indigo-50 font-bold text-indigo-900' : 'text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  {p.code && (
                                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold">
                                      {p.code}
                                    </span>
                                  )}
                                  <span>{p.name}</span>
                                  <span className="text-[10px] text-slate-400">({p.unit})</span>
                                  {isAlreadyInNote && (
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-semibold">
                                      Na nota
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    totalStock > 0 ? 'text-emerald-700' : 'text-rose-500'
                                  }`}
                                >
                                  {totalStock > 0 ? `${totalStock} un` : 'Sem estoque'}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Seleção do Lote */}
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Lote Disponível
                  </label>
                  <select
                    value={addingLotNumber}
                    disabled={!addingProductId || availableLotsForAddingProduct.length === 0}
                    onChange={(e) => {
                      setAddingLotNumber(e.target.value);
                      const lot = lots.find((l) => l.lotNumber === e.target.value);
                      if (lot) setAddingUnitPrice(lot.unitPrice);
                    }}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {!addingProductId ? (
                      <option value="">Escolha o produto</option>
                    ) : availableLotsForAddingProduct.length === 0 ? (
                      <option value="">Sem estoque</option>
                    ) : (
                      availableLotsForAddingProduct.map((l) => (
                        <option key={l.id} value={l.lotNumber}>
                          {l.lotNumber} ({l.quantity} un)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Quantidade */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Qtd
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={!addingProductId}
                    value={addingQuantity}
                    onChange={(e) => setAddingQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-center focus:border-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                {/* Preço Unitário */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!addingProductId}
                    value={addingUnitPrice}
                    onChange={(e) => setAddingUnitPrice(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-right focus:border-indigo-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Botão de Adicionar à Nota */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {addingProductId && addingUnitPrice > 0 && addingQuantity > 0 ? (
                    <>
                      Subtotal deste item:{' '}
                      <strong className="text-slate-800">
                        {formatCurrency(addingQuantity * addingUnitPrice)}
                      </strong>
                    </>
                  ) : (
                    'Preencha produto, lote e quantidade para incluir'
                  )}
                </span>

                <button
                  type="button"
                  onClick={handleAddItemToNote}
                  disabled={!addingProductId || !addingLotNumber}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Adicionar Produto à Nota</span>
                </button>
              </div>
            </div>

            {/* Botão e Campo: Desconto na Hora */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(!showDiscountInput)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    showDiscountInput || discountAmount > 0
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🏷️ Desconto na Hora</span>
                  {discountAmount > 0 && <span>(- {formatCurrency(effectiveDiscount)})</span>}
                </button>
                <span className="text-[11px] text-slate-500">
                  {discountAmount > 0 ? 'Desconto aplicado na nota!' : 'Clique para aplicar desconto imediato antes de fechar'}
                </span>
              </div>

              {showDiscountInput && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      max={subtotalAmount}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      placeholder="0,00"
                      className="w-28 pl-7 pr-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                  {discountAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDiscountAmount(0)}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Remover
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Resumo Financeiro da Nota com Desconto */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-600">
                  Subtotal: <strong>{formatCurrency(subtotalAmount)}</strong>
                </span>
                {effectiveDiscount > 0 && (
                  <span className="text-amber-700 font-bold">
                    Desconto: -{formatCurrency(effectiveDiscount)}
                  </span>
                )}
                {paymentMethod === 'CARTAO' && (
                  <span className="text-indigo-700 font-bold">
                    + Taxa Maquininha ({settings.defaultCardFee}%): +{formatCurrency(cardFeeAmount)}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-slate-500 text-[11px] mr-2">Total a Pagar pelo Cliente:</span>
                <strong className="text-indigo-900 text-sm font-black">
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Pagamento (Radio Options as shown in Slide 3) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Pagamento:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['PIX', 'DINHEIRO', 'CARTAO', 'A_PRAZO'] as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                    paymentMethod === method
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="sr-only"
                  />
                  <span>
                    {method === 'PIX'
                      ? 'Pix'
                      : method === 'DINHEIRO'
                      ? 'Dinheiro'
                      : method === 'CARTAO'
                      ? 'Cartão'
                      : 'A Prazo'}
                  </span>
                </label>
              ))}
            </div>

            {/* Pagamento em Cartão: A taxa é responsabilidade do cliente e é SOMADA */}
            {paymentMethod === 'CARTAO' && (
              <div className="p-3.5 bg-white rounded-xl border border-indigo-200 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span className="font-bold text-indigo-900">Cartão de Crédito / Débito:</span>
                  <span className="text-[11px] text-slate-500">
                    Taxa da maquininha: <strong>{settings.defaultCardFee}%</strong> (cobrada do cliente)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Valor Produtos (após desc.):</span>
                    <strong className="text-slate-800">{formatCurrency(baseAfterDiscount)}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Taxa Somada ao Cliente ({settings.defaultCardFee}%):</span>
                    <strong className="text-indigo-600">+ {formatCurrency(cardFeeAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Cobrado do Cliente:</span>
                    <strong className="text-emerald-700 text-sm font-extrabold">
                      {formatCurrency(totalAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Controle de Situação do Pagamento / Baixa (para Pix, Dinheiro e Cartão) */}
            {paymentMethod !== 'A_PRAZO' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Situação do Pagamento / Baixa:
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {darBaixaImediata ? 'Status: Pago imediato' : 'Status: Pendente (aguardando baixa)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDarBaixaImediata(false)}
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      !darBaixaImediata
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Aguardando Pagamento (Pendente)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Deixa o pedido como PENDENTE. Não dá baixa no caixa direto; você poderá clicar em <strong>"Dar Baixa"</strong> na tabela assim que conferir o pagamento.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDarBaixaImediata(true)}
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                      darBaixaImediata
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Já Recebido (Dar baixa no caixa agora)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dinheiro em mãos, Pix já recebido ou cartão passado na maquininha. Dá baixa imediata e credita no Caixa.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Venda a Prazo */}
            {paymentMethod === 'A_PRAZO' && (
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Condições de Venda a Prazo:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600">Vencimento:</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                {/* Alerta se data de vencimento for no passado */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  if (dueDate && dueDate < todayStr) {
                    const [tY, tM, tD] = todayStr.split('-').map(Number);
                    const [dY, dM, dD] = dueDate.split('-').map(Number);
                    const diffDays = Math.max(1, Math.round((Date.UTC(tY, tM - 1, tD) - Date.UTC(dY, dM - 1, dD)) / (1000 * 60 * 60 * 24)));
                    return (
                      <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-950">
                            ⚠️ Vencimento anterior a hoje ({diffDays} dia{diffDays > 1 ? 's' : ''} em atraso)!
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            A data informada ({dueDate.split('-').reverse().join('/')}) já expirou. Ao confirmar, o pedido e a fatura a receber serão gerados com status <strong>ATRASADO</strong> e o cliente será classificado como <strong>INADIMPLENTE</strong>.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Alerta se o cliente selecionado já for inadimplente */}
                {currentCustomer && currentCustomer.daysOverdue > 0 && currentCustomer.openBalance > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-2 shadow-2xs">
                    <span className="text-base shrink-0">🔴</span>
                    <div>
                      <p className="font-bold text-amber-900">
                        Atenção: Cliente já possui pendência em atraso!
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {currentCustomer.name} está com faturas vencidas há {currentCustomer.daysOverdue} dias (Saldo devedor total: {formatCurrency(currentCustomer.openBalance)}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Validation Warnings (Slide 4) */}
                {exceedsCredit && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1.5">
                    <div className="flex items-start gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>
                        ⚠️ Cliente possui R$ {currentCustomer?.openBalance.toFixed(2)} em aberto.
                        Novo pedido ultrapassa o limite de crédito!
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Limite total: {formatCurrency(currentCustomer?.creditLimit || 0)} | Disponível: {formatCurrency(availableCredit)} | Pedido: {formatCurrency(totalAmount)}.
                    </p>
                    <label className="flex items-center gap-2 pt-1 font-semibold text-rose-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overrideCreditLimit}
                        onChange={(e) => setOverrideCreditLimit(e.target.checked)}
                        className="rounded text-rose-600"
                      />
                      <span>Autorizar liberação de crédito extraordinária</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback banners */}
          {feedbackError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {feedbackError}
            </div>
          )}

          {feedbackSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {feedbackSuccess}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                if (onCloseInitialModal) onCloseInitialModal();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={orderItems.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <span>Confirmar e Gerar Pedido ({orderItems.length} {orderItems.length === 1 ? 'produto' : 'produtos'})</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Comprovante de Pedido / Nota */}
      {selectedOrderReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderReceipt(null)}
          title={`Comprovante do Pedido ${selectedOrderReceipt.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div id="print-order-receipt" className="p-4 bg-white rounded-xl border border-slate-300 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-center">
                <div className="font-extrabold text-slate-900 text-sm">
                  {settings.companyName}
                </div>
                <div className="text-slate-600 text-[11px]">
                  CNPJ: {settings.cnpj}
                </div>
                <div className="text-slate-500 text-[10px]">
                  {settings.address} • {settings.phone}
                </div>
              </div>

              <div className="space-y-1 border-b border-slate-100 pb-2">
                <p>
                  <strong>Pedido:</strong> {selectedOrderReceipt.orderNumber}
                </p>
                <p>
                  <strong>Cliente:</strong> {selectedOrderReceipt.customerName}
                </p>
                <p>
                  <strong>Data de Emissão:</strong> {selectedOrderReceipt.createdAt}
                </p>
                <p>
                  <strong>Forma de Pagamento:</strong> {selectedOrderReceipt.paymentMethod === 'A_PRAZO' ? 'A Prazo' : selectedOrderReceipt.paymentMethod}
                </p>
                {selectedOrderReceipt.dueDate && (
                  <p>
                    <strong>Data de Vencimento:</strong>{' '}
                    {selectedOrderReceipt.dueDate.split('-').reverse().join('/')}
                  </p>
                )}
              </div>

              {/* Tabela de Produtos na Nota / Comprovante */}
              <div className="py-2 space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
                  <span>Produtos ({selectedOrderReceipt.items.length})</span>
                  <span>Subtotal</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrderReceipt.items.map((i, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {i.productCode && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                              {i.productCode}
                            </span>
                          )}
                          <span>{i.productName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {i.quantity} un × {formatCurrency(i.unitPrice)} • Lote: <span className="font-mono font-semibold text-indigo-700">{i.lotNumber}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{formatCurrency(i.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal dos Produtos:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedOrderReceipt.totalAmount)}</span>
                </div>
                {selectedOrderReceipt.cardFeeAmount ? (
                  <div className="flex justify-between text-xs text-amber-700">
                    <span>Taxa da Maquininha ({selectedOrderReceipt.cardFeePercentage}%) [repasse cliente]:</span>
                    <span>+ {formatCurrency(selectedOrderReceipt.cardFeeAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total a Pagar pelo Cliente:</span>
                  <span className="text-indigo-700 font-black">
                    {formatCurrency(selectedOrderReceipt.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Comprovante oficial de venda com canhoto.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderReceipt(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadPrintableFile({
                        title: `Comprovante-${selectedOrderReceipt.orderNumber}`,
                        elementId: 'print-order-receipt',
                        filename: `comprovante-${selectedOrderReceipt.orderNumber}.html`,
                      })
                    }
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Baixar comprovante em arquivo HTML para imprimir"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Baixar Arquivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerPrint({
                        title: `Comprovante Pedido ${selectedOrderReceipt.orderNumber} - ${selectedOrderReceipt.customerName}`,
                        elementId: 'print-order-receipt',
                      })
                    }
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Comprovante</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                💡 <strong>Impressão sem bloqueio:</strong> Abre a página de impressão formatada em nova guia e chama a sua impressora. Se preferir, clique em <em>Baixar Arquivo</em> para abrir e imprimir diretamente.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Baixa de Pagamento (Total ou Parcial) */}
      {orderToBaixa && (
        <Modal
          isOpen={true}
          onClose={() => setOrderToBaixa(null)}
          title={`Confirmar Baixa • Pedido ${orderToBaixa.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <strong className="text-slate-800">{orderToBaixa.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Forma de Pagamento:</span>
                <span className="font-semibold text-slate-800">
                  {orderToBaixa.paymentMethod === 'A_PRAZO'
                    ? 'A Prazo'
                    : orderToBaixa.paymentMethod === 'PIX'
                    ? 'Pix'
                    : orderToBaixa.paymentMethod === 'CARTAO'
                    ? 'Cartão'
                    : 'Dinheiro'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Total da Venda:</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {formatCurrency(orderToBaixa.totalAmount)}
                </span>
              </div>
              {orderToBaixa.paidAmount && orderToBaixa.paidAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor já Amortizado:</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    {formatCurrency(orderToBaixa.paidAmount)}
                  </span>
                </div>
              ) : null}
              {(() => {
                const curRemaining = orderToBaixa.remainingAmount !== undefined
                  ? orderToBaixa.remainingAmount
                  : (orderToBaixa.totalAmount - (orderToBaixa.paidAmount || 0));
                return (
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Saldo Restante a Liquidar:</span>
                    <span className="font-black text-amber-700 text-sm">
                      {formatCurrency(curRemaining)}
                    </span>
                  </div>
                );
              })()}
            </div>

            {(() => {
              const curRemaining = orderToBaixa.remainingAmount !== undefined
                ? orderToBaixa.remainingAmount
                : (orderToBaixa.totalAmount - (orderToBaixa.paidAmount || 0));

              return (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Qual o valor pago pelo cliente nesta baixa? (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={curRemaining}
                      value={baixaAmountInput || ''}
                      onChange={(e) => setBaixaAmountInput(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                      placeholder="0,00"
                      autoFocus
                    />
                  </div>

                  {/* Botões de atalho rápido */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setBaixaAmountInput(curRemaining)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      Pagar Saldo Restante ({formatCurrency(curRemaining)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBaixaAmountInput(+(curRemaining / 2).toFixed(2))}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      50% do Restante ({formatCurrency(curRemaining / 2)})
                    </button>
                  </div>

                  {/* Explicação de baixa total ou parcial */}
                  <div className="mt-3">
                    {baixaAmountInput >= curRemaining ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Baixa Total (Valor Integral)
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          O pedido mudará imediatamente para <strong>PAGO</strong>. O valor total da venda permanece <strong>{formatCurrency(orderToBaixa.totalAmount)}</strong> para as estatísticas do mês.
                        </p>
                      </div>
                    ) : baixaAmountInput > 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Baixa Parcial (Continuará Pendente)
                        </p>
                        <p className="text-[11px] text-amber-800">
                          Será dado baixa de <strong>{formatCurrency(baixaAmountInput)}</strong> no caixa. O pedido continuará pendente com o saldo restante de <strong>{formatCurrency(Math.max(0, curRemaining - baixaAmountInput))}</strong>. A venda total do mês continuará registrada em <strong>{formatCurrency(orderToBaixa.totalAmount)}</strong>!
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderToBaixa(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBaixa(orderToBaixa)}
                disabled={baixaAmountInput <= 0}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Baixa ({formatCurrency(baixaAmountInput)})</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
