import React, { useState } from 'react';
import {
  Users,
  Phone,
  MapPin,
  DollarSign,
  CreditCard,
  Clock,
  Package,
  AlertTriangle,
  Plus,
  Search,
  MessageCircle,
  Edit2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { Modal } from '../common/Modal';

export const ClientesView: React.FC = () => {
  const {
    customers,
    orders,
    addCustomer,
    updateCustomer,
    setActiveView,
    targetClientForCreditLimitEdit,
    setTargetClientForCreditLimitEdit,
  } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1'); // João da Silva as in PDF
  const [search, setSearch] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Deep-linking from Settings > Clientes (pencil click)
  React.useEffect(() => {
    if (targetClientForCreditLimitEdit) {
      setSelectedCustomerId(targetClientForCreditLimitEdit);
      setIsEditModalOpen(true);
      setTargetClientForCreditLimitEdit(null);
    }
  }, [targetClientForCreditLimitEdit, setTargetClientForCreditLimitEdit]);

  // New customer form (Clientes novos começam com limite de R$ 0,00 conforme solicitado)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDocument, setNewDocument] = useState('');
  const [newLimit, setNewLimit] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;

  const customerOrders = orders.filter((o) => o.customerId === activeCustomer?.id);

  // Credit metrics: allow creditLimit = 0!
  const creditLimit = activeCustomer?.creditLimit !== undefined ? activeCustomer.creditLimit : 0;
  const utilizedCredit = activeCustomer?.openBalance || 0;
  const availableCredit = Math.max(0, creditLimit - utilizedCredit);
  const utilizationPercent =
    creditLimit > 0 ? Math.min(100, Math.round((utilizedCredit / creditLimit) * 100)) : (utilizedCredit > 0 ? 100 : 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name: newName,
      phone: newPhone,
      address: newAddress,
      document: newDocument,
      creditLimit: !isNaN(Number(newLimit)) ? Math.max(0, Number(newLimit)) : 0,
      notes: newNotes,
    });
    setIsNewCustomerModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewLimit(0);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${name}, tudo bem? Aqui é da central de atendimento da empresa.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Ficha de Clientes & Limite de Crédito
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de histórico comercial, limite de compras a prazo e acompanhamento de inadimplência.
          </p>
        </div>

        <button
          onClick={() => setIsNewCustomerModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* Main Grid: Customer List on the Left, Complete Ficha do Cliente on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Customer List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-slate-500">Nenhum cliente cadastrado ainda.</p>
                  <button
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                  >
                    + Cadastrar Cliente
                  </button>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                const isOverdue = c.daysOverdue > 0 && c.openBalance > 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 border border-indigo-200 shadow-xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {c.name}
                          </h4>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded">
                              🔴 {c.daysOverdue}d atraso
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block">Em aberto</span>
                        <span
                          className={`text-xs font-bold ${
                            c.openBalance > 0 ? 'text-amber-700' : 'text-slate-700'
                          }`}
                        >
                          {formatCurrency(c.openBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Ficha do Cliente (Exact specification from Slide 4) */}
        <div className="lg:col-span-7">
          {activeCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
              {/* Header of Ficha */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {activeCustomer.name}
                  </h3>
                  {activeCustomer.document && (
                    <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                      CPF/CNPJ: {activeCustomer.document}
                    </span>
                  )}
                  {activeCustomer.daysOverdue > 0 && activeCustomer.openBalance > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 rounded-lg mt-1.5">
                      <span>🔴</span>
                      <span>CLIENTE INADIMPLENTE ({activeCustomer.daysOverdue} dias de atraso)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleOpenWhatsApp(activeCustomer.phone, activeCustomer.name)
                    }
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200"
                    title="Editar limite e dados"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info (Telefone e Endereço clicáveis para ligação e GPS/Maps) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                      Telefone (clique para ligar)
                    </span>
                    <a
                      href={`tel:${activeCustomer.phone.replace(/\D/g, '')}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1.5 mt-0.5 truncate"
                      title="Ligar para o número cadastrado"
                    >
                      <span>{activeCustomer.phone}</span>
                      <span className="text-[10px] font-normal text-slate-400">📞 Ligar</span>
                    </a>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                      Endereço (clique para abrir no Maps)
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCustomer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 mt-0.5"
                      title="Abrir no Google Maps ou aplicativo de navegação"
                    >
                      <span className="truncate">{activeCustomer.address}</span>
                      <span className="text-[10px] font-normal text-slate-400 shrink-0">📍 Abrir GPS ↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Financial Metrics (Total comprado, Valor em aberto, Dias em atraso) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    💰 Total comprado
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 block mt-1">
                    {formatCurrency(activeCustomer.totalPurchased)}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    💳 Valor em aberto
                  </span>
                  <span
                    className={`text-lg font-extrabold block mt-1 ${
                      activeCustomer.openBalance > 0 ? 'text-amber-600' : 'text-slate-800'
                    }`}
                  >
                    {formatCurrency(activeCustomer.openBalance)}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    🕐 Dias em atraso
                  </span>
                  <span
                    className={`text-lg font-extrabold block mt-1 ${
                      activeCustomer.daysOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {activeCustomer.daysOverdue > 0
                      ? `${activeCustomer.daysOverdue} dias`
                      : 'Em dia (0)'}
                  </span>
                </div>
              </div>

              {/* Limite de Crédito Box (The core feature highlighted in Slide 4) */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-2xl border border-indigo-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    E principalmente: Limite de crédito
                  </span>
                  <span className="text-xs font-bold text-indigo-700">
                    {utilizationPercent}% utilizado
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      utilizationPercent >= 100
                        ? 'bg-rose-600'
                        : utilizationPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>

                {/* Exact numbers breakdown matching Slide 4:
                    Limite: R$ 1.000 | Utilizado: R$ 850 | Disponível: R$ 150 */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Limite de Crédito
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5">
                      {formatCurrency(creditLimit)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Utilizado
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-700 block mt-0.5">
                      {formatCurrency(utilizedCredit)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Disponível
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 block mt-0.5">
                      {formatCurrency(availableCredit)}
                    </span>
                  </div>
                </div>

                {/* Alerta de Inadimplência se tiver dias em atraso */}
                {activeCustomer.daysOverdue > 0 && activeCustomer.openBalance > 0 && (
                  <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 text-xs text-rose-900 flex items-start gap-2.5 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">
                        🔴 Alerta de Inadimplência: Faturas vencidas há {activeCustomer.daysOverdue} dia(s)
                      </p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Este cliente possui {formatCurrency(activeCustomer.openBalance)} com prazo de pagamento expirado. Recomenda-se realizar a cobrança via WhatsApp antes de aprovar novas compras a prazo.
                      </p>
                    </div>
                  </div>
                )}

                {/* Warning callout from Slide 4:
                    "Se ele tentar comprar mais: ⚠️ Cliente possui R$ 850 em aberto. Novo pedido ultrapassa o limite de crédito." */}
                {utilizedCredit > 0 && (
                  <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        ⚠️ Cliente possui {formatCurrency(utilizedCredit)} em aberto.
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Qualquer novo pedido a prazo acima de {formatCurrency(availableCredit)} exigirá autorização de crédito ou pagamento prévio.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 📦 Últimos Pedidos do Cliente */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-400" />
                    📦 Últimos pedidos deste cliente
                  </h4>
                  <button
                    onClick={() => setActiveView('pedidos')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Criar novo pedido
                  </button>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                    Nenhum pedido registrado ainda para este cliente.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900 mr-2">
                            {ord.orderNumber}
                          </span>
                          <span className="text-slate-500">
                            {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ord.createdAt} • {ord.paymentMethod}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 block">
                            {formatCurrency(ord.totalAmount)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${
                              ord.paymentStatus === 'PAGO'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              Selecione um cliente para visualizar sua ficha completa.
            </div>
          )}
        </div>
      </div>

      {/* Modal: + Novo Cliente */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Cadastrar Novo Cliente"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo / Razão Social
            </label>
            <input
              type="text"
              placeholder="Ex: João da Silva"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CPF / CNPJ
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              placeholder="Rua das Palmeiras, 142 - Centro"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Limite de Crédito Inicial (R$)
            </label>
            <input
              type="number"
              step="50"
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações
            </label>
            <input
              type="text"
              placeholder="Ex: Paga sempre em dia, prefere entrega às terças"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Cadastrar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Limite do Cliente */}
      {activeCustomer && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Ajustar Limite de Crédito • ${activeCustomer.name}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Limite de Crédito Aprovado (R$)
              </label>
              <input
                type="number"
                step="100"
                defaultValue={activeCustomer.creditLimit}
                id="editLimitInput"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                defaultValue={activeCustomer.phone}
                id="editPhoneInput"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                defaultValue={activeCustomer.address}
                id="editAddressInput"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const limitInput = document.getElementById('editLimitInput') as HTMLInputElement;
                  const limitVal = limitInput ? Number(limitInput.value) : NaN;
                  const phoneVal = (
                    document.getElementById('editPhoneInput') as HTMLInputElement
                  )?.value;
                  const addressVal = (
                    document.getElementById('editAddressInput') as HTMLInputElement
                  )?.value;

                  updateCustomer(activeCustomer.id, {
                    creditLimit: !isNaN(limitVal) && limitVal >= 0 ? limitVal : activeCustomer.creditLimit,
                    phone: phoneVal || activeCustomer.phone,
                    address: addressVal || activeCustomer.address,
                  });
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
