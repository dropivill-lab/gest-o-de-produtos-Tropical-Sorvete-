import React, { useState } from 'react';
import {
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  QrCode,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LotItem, Product } from '../../types';
import { Modal } from '../common/Modal';

export const EstoqueView: React.FC = () => {
  const {
    lots,
    products,
    settings,
    addProduct,
    addLot,
    updateLotQuantity,
    setActiveView,
    targetLotForAdjust,
    setTargetLotForAdjust,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [expandedLotId, setExpandedLotId] = useState<string | null>('lot-1'); // Expanded by default to show example from PDF!

  // Modals
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedLotForAdjust, setSelectedLotForAdjust] = useState<LotItem | null>(null);
  const [adjustType, setAdjustType] = useState<'ENTRADA' | 'PERDA'>('ENTRADA');
  const [adjustQtyInput, setAdjustQtyInput] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Deep linking from Settings > Estoque (pencil click)
  React.useEffect(() => {
    if (targetLotForAdjust) {
      const lot = lots.find((l) => l.id === targetLotForAdjust || l.productId === targetLotForAdjust);
      if (lot) {
        setSelectedLotForAdjust(lot);
        setAdjustType('ENTRADA');
        setAdjustQtyInput(1);
        setAdjustReason('');
        setIsAdjustModalOpen(true);
      }
      setTargetLotForAdjust(null);
    }
  }, [targetLotForAdjust, lots, setTargetLotForAdjust]);

  // New Lot form
  const [newLotProduct, setNewLotProduct] = useState(products[0]?.id || '');
  const [productCodeInput, setProductCodeInput] = useState(products[0]?.code || 'PRD-001');
  const [customProductName, setCustomProductName] = useState('');
  const [newLotNumber, setNewLotNumber] = useState('');
  const [newLotQty, setNewLotQty] = useState(20);
  const [newLotCost, setNewLotCost] = useState(42.0);
  const [newLotPrice, setNewLotPrice] = useState(75.0);
  const [newLotMfg, setNewLotMfg] = useState(new Date().toISOString().split('T')[0]);
  const [newLotExp, setNewLotExp] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newLotObs, setNewLotObs] = useState('');

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.productName.toLowerCase().includes(search.toLowerCase()) ||
      lot.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      (lot.productCode && lot.productCode.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'PROXIMO_VENCIMENTO') {
      if (!lot.expiryDate || lot.quantity <= 0) return false;
      const expMs = new Date(lot.expiryDate).getTime();
      const diffMs = expMs - Date.now();
      const alertMs = (settings.alertDaysBeforeExpiry || 30) * 24 * 60 * 60 * 1000;
      return diffMs <= alertMs || lot.status === 'PROXIMO_VENCIMENTO' || lot.status === 'VENCIDO';
    }
    if (filterStatus === 'BAIXO_ESTOQUE') {
      return lot.quantity > 0 && lot.quantity <= 10;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedLotId(expandedLotId === id ? null : id);
  };

  const handleOpenAdjust = (lot: LotItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLotForAdjust(lot);
    setAdjustType('ENTRADA');
    setAdjustQtyInput(1);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (selectedLotForAdjust && adjustQtyInput > 0) {
      const finalDelta = adjustType === 'ENTRADA' ? adjustQtyInput : -adjustQtyInput;
      const defaultReason = adjustType === 'ENTRADA' ? 'Entrada / Reposição de estoque' : 'Perda / Ajuste de estoque';
      updateLotQuantity(selectedLotForAdjust.id, finalDelta, adjustReason.trim() || defaultReason);
      setIsAdjustModalOpen(false);
    }
  };

  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    let prod = products.find((p) => p.id === newLotProduct);
    let prodId = newLotProduct;
    let prodName = prod ? prod.name : customProductName.trim() || 'Produto';
    const finalCode = productCodeInput.trim() || prod?.code || `PRD-${Date.now().toString().slice(-4)}`;

    if (!prod && customProductName.trim()) {
      const generatedProdId = `prod-${Date.now()}`;
      addProduct({
        name: customProductName.trim(),
        code: finalCode,
        category: 'Geral',
        minStock: 10,
        unit: 'Unidade',
      });
      prodId = generatedProdId;
      prodName = customProductName.trim();
    } else if (prod && productCodeInput.trim() && prod.code !== productCodeInput.trim()) {
      prod.code = finalCode;
    }

    const lotCode = newLotNumber.trim() || `LOT-${Date.now().toString().slice(-6)}`;

    addLot({
      lotNumber: lotCode,
      productId: prodId,
      productCode: finalCode,
      productName: prodName,
      quantity: Number(newLotQty),
      initialQuantity: Number(newLotQty),
      manufacturingDate: newLotMfg,
      expiryDate: newLotExp,
      unitCost: Number(newLotCost),
      unitPrice: Number(newLotPrice),
      status: 'EM_ESTOQUE',
      observations: newLotObs,
    });

    setIsNewLotModalOpen(false);
    setCustomProductName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código ou lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('TODOS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'TODOS'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos os lotes ({lots.length})
          </button>
          <button
            onClick={() => setFilterStatus('PROXIMO_VENCIMENTO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'PROXIMO_VENCIMENTO'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            ⚠️ Próximos do vencimento
          </button>
          <button
            onClick={() => setFilterStatus('BAIXO_ESTOQUE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'BAIXO_ESTOQUE'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            📦 Estoque baixo (≤ 10 un)
          </button>

          <button
            onClick={() => {
              const currentProd = products.find((p) => p.id === newLotProduct);
              if (currentProd) setProductCodeInput(currentProd.code || '');
              setIsNewLotModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cadastrar Novo Lote</span>
          </button>
        </div>
      </div>

      {/* Stock Cards Grid (Following Slide 2 format) */}
      {filteredLots.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhum lote em estoque</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lots.length === 0
              ? 'O estoque está completamente limpo. Cadastre um novo produto/lote ou registre uma produção para começar.'
              : 'Nenhum lote encontrado com os filtros atuais.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setIsNewLotModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              + Cadastrar Primeiro Lote / Produto
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredLots.map((lot) => {
          const isExpanded = expandedLotId === lot.id;
          const profitMargin = lot.unitPrice - lot.unitCost;
          const profitPercent = ((profitMargin / lot.unitPrice) * 100).toFixed(1);
          const totalLotStockValue = lot.quantity * lot.unitPrice;

          return (
            <div
              key={lot.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isExpanded
                  ? 'border-indigo-400 bg-white ring-2 ring-indigo-100'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Collapsed Top Header (As seen in Slide 2) */}
              <div
                onClick={() => toggleExpand(lot.id)}
                className={`p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                  isExpanded ? 'bg-indigo-50/30 border-b border-indigo-100' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                      lot.quantity <= 10
                        ? 'bg-amber-500'
                        : lot.status === 'PROXIMO_VENCIMENTO'
                        ? 'bg-amber-600'
                        : 'bg-indigo-600'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                  </div>

                  <div>
                    {lot.quantity <= 10 && (
                      <div className="mb-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                          Estoque Baixo
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                        {lot.productName}
                      </h3>
                      {(lot.productCode || products.find((p) => p.id === lot.productId)?.code) && (
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                          Cód: {lot.productCode || products.find((p) => p.id === lot.productId)?.code}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-indigo-700 mt-0.5">
                      Quantidade: <span className="text-base font-bold text-slate-900">{lot.quantity} unidades</span>
                    </p>
                  </div>
                </div>

                {/* Arrow Icon / Toggle Indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
                      isExpanded
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={isExpanded ? 'Recolher detalhes' : 'Ver detalhes do lote'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Card Details (Exact fields from Slide 2) */}
              {isExpanded && (
                <div className="p-5 bg-gradient-to-b from-white to-slate-50/50 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Lote */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Lote
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-800 truncate block mt-0.5">
                        {lot.lotNumber}
                      </span>
                    </div>

                    {/* Fabricação */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Fabricação
                      </span>
                      <span className="text-sm font-bold text-slate-700 block mt-0.5">
                        {formatDate(lot.manufacturingDate)}
                      </span>
                    </div>

                    {/* Validade */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Validade
                      </span>
                      <span
                        className={`text-sm font-bold block mt-0.5 ${
                          lot.status === 'PROXIMO_VENCIMENTO'
                            ? 'text-amber-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {formatDate(lot.expiryDate)}
                      </span>
                    </div>

                    {/* Custo */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Custo
                      </span>
                      <span className="text-sm font-bold text-rose-600 block mt-0.5">
                        {formatCurrency(lot.unitCost)}
                      </span>
                    </div>

                    {/* Preço */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Preço
                      </span>
                      <span className="text-sm font-bold text-emerald-600 block mt-0.5">
                        {formatCurrency(lot.unitPrice)}
                      </span>
                    </div>

                    {/* Margem Lucro */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Margem Unitária
                      </span>
                      <span className="text-sm font-bold text-indigo-600 block mt-0.5">
                        +{formatCurrency(profitMargin)} ({profitPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Summary & Quick Actions */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Total avaliado em estoque:{' '}
                      <strong className="text-slate-800 font-bold">
                        {formatCurrency(totalLotStockValue)}
                      </strong>{' '}
                      ({lot.quantity} un × {formatCurrency(lot.unitPrice)})
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleOpenAdjust(lot, e)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Ajustar Quantidade / Perda
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('rastreamento');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Rastrear Lote</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Modal: Novo Lote */}
      <Modal
        isOpen={isNewLotModalOpen}
        onClose={() => setIsNewLotModalOpen(false)}
        title="Cadastrar Novo Lote / Entrada em Estoque"
      >
        <form onSubmit={handleCreateLot} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Produto
            </label>
            {products.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={newLotProduct}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewLotProduct(val);
                    if (val !== '__NEW__') {
                      setCustomProductName('');
                      const matched = products.find((p) => p.id === val);
                      if (matched) setProductCodeInput(matched.code || '');
                    } else {
                      setProductCodeInput(`PRD-${String(products.length + 1).padStart(3, '0')}`);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name} ({p.unit})
                    </option>
                  ))}
                  <option value="__NEW__">+ Cadastrar Novo Produto...</option>
                </select>

                {newLotProduct === '__NEW__' && (
                  <input
                    type="text"
                    placeholder="Nome do novo produto (ex: Açaí 10 L)"
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-indigo-300 rounded-xl"
                    required
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Nome do produto (ex: Açaí 10 L)"
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-indigo-300 rounded-xl"
                required
              />
            )}
          </div>

          {/* Campo: Código do Produto (solicitado pelo usuário) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Código do Produto</span>
              <span className="text-[10px] text-slate-400 font-normal">Ex: PRD-001, ACA-10L ou SKU</span>
            </label>
            <input
              type="text"
              placeholder="Ex: PRD-001"
              value={productCodeInput}
              onChange={(e) => setProductCodeInput(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white text-indigo-900"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Código utilizado para localizar e autocompletar este produto na emissão de novos pedidos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número do Lote
              </label>
              <input
                type="text"
                placeholder="Ex: AC20261007"
                value={newLotNumber}
                onChange={(e) => setNewLotNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade Inicial
              </label>
              <input
                type="number"
                min="1"
                value={newLotQty}
                onChange={(e) => setNewLotQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data de Fabricação
              </label>
              <input
                type="date"
                value={newLotMfg}
                onChange={(e) => setNewLotMfg(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data de Validade
              </label>
              <input
                type="date"
                value={newLotExp}
                onChange={(e) => setNewLotExp(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custo Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={newLotCost}
                onChange={(e) => setNewLotCost(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço de Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={newLotPrice}
                onChange={(e) => setNewLotPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações / Laudo
            </label>
            <input
              type="text"
              placeholder="Ex: Brix 14, temperatura -18°C"
              value={newLotObs}
              onChange={(e) => setNewLotObs(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewLotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Confirmar e Cadastrar Lote
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ajustar Estoque / Perda com botões claros e motivo em texto livre */}
      {selectedLotForAdjust && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Ajustar Quantidade / Perda • Lote ${selectedLotForAdjust.lotNumber}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Produto:</span>
                <strong className="text-slate-900 font-bold text-sm">{selectedLotForAdjust.productName}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Estoque Atual:</span>
                <strong className="text-indigo-700 font-black text-sm">{selectedLotForAdjust.quantity} un</strong>
              </div>
            </div>

            {/* Tipo de Ajuste: Botões claros (+) e (-) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipo de Ajuste:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('ENTRADA')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adjustType === 'ENTRADA'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                      : 'bg-white text-emerald-800 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="text-sm">🟢</span>
                  <span>+ Entrada / Reposição</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('PERDA')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    adjustType === 'PERDA'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-300'
                      : 'bg-white text-rose-800 border-slate-200 hover:bg-rose-50'
                  }`}
                >
                  <span className="text-sm">🔴</span>
                  <span>− Perda / Baixa</span>
                </button>
              </div>
            </div>

            {/* Quantidade a Ajustar (número simples positivo) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade a {adjustType === 'ENTRADA' ? 'Adicionar' : 'Dar Baixa'}:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={adjustType === 'PERDA' ? selectedLotForAdjust.quantity : undefined}
                  value={adjustQtyInput || ''}
                  onChange={(e) => setAdjustQtyInput(Math.max(1, Number(e.target.value)))}
                  placeholder="Ex: 5"
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              {/* Pré-visualização do Estoque */}
              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500">Resultado no estoque:</span>
                <span className="font-extrabold text-slate-800">
                  {selectedLotForAdjust.quantity} un{' '}
                  <span className={adjustType === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}>
                    {adjustType === 'ENTRADA' ? `+ ${adjustQtyInput || 0}` : `− ${adjustQtyInput || 0}`}
                  </span>{' '}
                  ={' '}
                  <strong className="text-indigo-700">
                    {Math.max(0, selectedLotForAdjust.quantity + (adjustType === 'ENTRADA' ? (adjustQtyInput || 0) : -(adjustQtyInput || 0)))} un
                  </strong>
                </span>
              </div>
            </div>

            {/* Motivo do Ajuste: Campo de Texto Livre para Escrever */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo do Ajuste (Escreva livremente o motivo)
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Avaria na câmara fria, lote danificado no transporte, inventário, etc."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                disabled={adjustQtyInput <= 0}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer shadow-xs transition-all ${
                  adjustType === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {adjustType === 'ENTRADA'
                  ? `Confirmar Entrada (+${adjustQtyInput || 0} un)`
                  : `Confirmar Baixa/Perda (-${adjustQtyInput || 0} un)`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
