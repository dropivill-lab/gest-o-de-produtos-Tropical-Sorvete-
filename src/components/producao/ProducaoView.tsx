import React, { useState } from 'react';
import {
  Factory,
  Package,
  Layers,
  FileText,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Printer,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ProductionLotItem, FlavorItem } from '../../types';
import { triggerPrint, downloadPrintableFile } from '../../utils/printHelper';

export const ProducaoView: React.FC = () => {
  const {
    settings,
    setActiveView,
    flavors,
    addFlavor,
    updateFlavor,
    deleteFlavor,
    baseIceCreamIngredients,
    setBaseIceCreamIngredients,
    baseAcaiIngredients,
    setBaseAcaiIngredients,
    productionLots,
    createProductionLot,
    updateProductionLotQty,
    productionNotes,
    addProductionNote,
    updateProductionNote,
    deleteProductionNote,
    productionLabelSettings,
    updateProductionLabelSettings,
  } = useApp();

  // Internal navigation for the Production dedicated module
  // Options: 'inicio' | 'estoque' | 'insumos' | 'nota' | 'configuracao'
  const [currentSection, setCurrentSection] = useState<
    'inicio' | 'estoque' | 'insumos' | 'nota' | 'configuracao'
  >('inicio');

  // Início state: null (buttons shown) | 'SORVETE' | 'ACAI'
  const [activeProductionForm, setActiveProductionForm] = useState<'SORVETE' | 'ACAI' | null>(null);

  // Início Form States
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(flavors[0]?.id || '');
  const [lotCodeInput, setLotCodeInput] = useState<string>('');
  const [packagingInput, setPackagingInput] = useState<string>('Caixa');
  const [unitMeasureInput, setUnitMeasureInput] = useState<'L' | 'kg'>('L');
  const [qtyInput, setQtyInput] = useState<number>(20);
  const [mfgDateInput, setMfgDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expDateInput, setExpDateInput] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [unitPriceInput, setUnitPriceInput] = useState<number>(75.0);
  const [obsInput, setObsInput] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Insumos section state: 'SORVETE' | 'ACAI'
  const [insumosSubTab, setInsumosSubTab] = useState<'SORVETE' | 'ACAI'>('SORVETE');
  const [insumosFlavorId, setInsumosFlavorId] = useState<string>(flavors[0]?.id || '');

  // Adding ingredient inputs (Base)
  const [newBaseIngName, setNewBaseIngName] = useState<string>('');
  const [newBaseIngQty, setNewBaseIngQty] = useState<string>('');

  // Adding ingredient inputs (Flavor)
  const [newFlavorIngName, setNewFlavorIngName] = useState<string>('');
  const [newFlavorIngQty, setNewFlavorIngQty] = useState<string>('');
  const [flavorUnitCostInput, setFlavorUnitCostInput] = useState<number>(45.0);

  // Configuração section tab: 'sorvete' | 'sabores' | 'acai'
  const [configSubTab, setConfigSubTab] = useState<'sorvete' | 'sabores' | 'acai'>('sorvete');
  const [configSelectedFlavorId, setConfigSelectedFlavorId] = useState<string>(flavors[0]?.id || '');

  // Modals
  const [selectedLotForLabel, setSelectedLotForLabel] = useState<ProductionLotItem | null>(null);
  const [selectedLotForLoss, setSelectedLotForLoss] = useState<ProductionLotItem | null>(null);
  const [lossQtyInput, setLossQtyInput] = useState<number>(1);
  const [lossReasonInput, setLossReasonInput] = useState<string>('');
  const [selectedLotForTrack, setSelectedLotForTrack] = useState<ProductionLotItem | null>(null);

  // New Flavor Modal
  const [isNewFlavorModalOpen, setIsNewFlavorModalOpen] = useState<boolean>(false);
  const [newFlavorName, setNewFlavorName] = useState<string>('');
  const [newFlavorAllergens, setNewFlavorAllergens] = useState<string>('CONTÉM DERIVADOS DE LEITE E SOJA.');

  // Note Section States
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState<string>('');

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  // Helper to calculate auto lot code preview for the user
  const getAutoLotCodePreview = (type: 'SORVETE' | 'ACAI') => {
    const prefix = type === 'SORVETE' ? 'S' : 'A';
    const [year, month, day] = (mfgDateInput || new Date().toISOString().split('T')[0]).split('-');
    const dd = String(day || '01').padStart(2, '0');
    const mm = String(month || '01').padStart(2, '0');
    const existingCount = productionLots.filter(
      (l) => l.productType === type && l.manufacturingDate === mfgDateInput
    ).length;
    const seq = String(existingCount + 1).padStart(2, '0');
    return `${prefix}${dd}${mm}-${seq}`;
  };

  // Handle production lot save
  const handleSaveProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductionForm) return;

    const chosenFlavor = flavors.find((f) => f.id === selectedFlavorId);
    const finalFlavorName = activeProductionForm === 'SORVETE' ? (chosenFlavor?.name || 'Tradicional') : undefined;

    const finalLotCode = lotCodeInput.trim() || getAutoLotCodePreview(activeProductionForm);

    createProductionLot({
      productType: activeProductionForm,
      flavorName: finalFlavorName,
      lotNumber: finalLotCode,
      packaging: packagingInput.trim() || 'Caixa',
      unitMeasure: unitMeasureInput,
      quantity: Number(qtyInput) || 1,
      initialQuantity: Number(qtyInput) || 1,
      manufacturingDate: mfgDateInput,
      expiryDate: expDateInput,
      unitPrice: Number(unitPriceInput) || 75.0,
      observations: obsInput.trim(),
    });

    setSaveSuccessMessage(
      `✓ Lote ${finalLotCode} (${activeProductionForm === 'SORVETE' ? `Sorvete ${finalFlavorName}` : 'Açaí'}) cadastrado com sucesso e integrado ao estoque geral!`
    );

    // Reset form
    setLotCodeInput('');
    setObsInput('');
    setTimeout(() => {
      setSaveSuccessMessage(null);
      setCurrentSection('estoque');
      setActiveProductionForm(null);
    }, 1200);
  };

  // Handle adding ingredient to Base
  const handleAddBaseIngredient = () => {
    if (!newBaseIngName.trim()) return;
    const item = { name: newBaseIngName.trim(), quantity: newBaseIngQty.trim() || '1 kg' };
    if (insumosSubTab === 'SORVETE') {
      setBaseIceCreamIngredients((prev) => [...prev, item]);
    } else {
      setBaseAcaiIngredients((prev) => [...prev, item]);
    }
    setNewBaseIngName('');
    setNewBaseIngQty('');
  };

  // Handle adding ingredient to selected Flavor
  const handleAddFlavorIngredient = () => {
    if (!newFlavorIngName.trim() || !insumosFlavorId) return;
    const item = { name: newFlavorIngName.trim(), quantity: newFlavorIngQty.trim() || '1 kg' };
    const target = flavors.find((f) => f.id === insumosFlavorId);
    if (target) {
      updateFlavor(insumosFlavorId, {
        ingredients: [...target.ingredients, item],
      });
    }
    setNewFlavorIngName('');
    setNewFlavorIngQty('');
  };

  // Handle creating a new flavor
  const handleCreateNewFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlavorName.trim()) return;
    const created = addFlavor({
      name: newFlavorName.trim(),
      ingredients: [],
      unitCost: 45.0,
      allergens: newFlavorAllergens.trim() || 'CONTÉM DERIVADOS DE LEITE E SOJA.',
      nutritionTable: {
        servingsPerPackage: '20',
        servingSize: '60 g (1 bola)',
        energeticValue: { per100g: '180 kcal', perServing: '108 kcal', vdPercent: '5%' },
        carbohydrates: { per100g: '26 g', perServing: '16 g', vdPercent: '5%' },
        totalSugars: { per100g: '22 g', perServing: '13 g', vdPercent: '**' },
        addedSugars: { per100g: '18 g', perServing: '11 g', vdPercent: '22%' },
        proteins: { per100g: '3.5 g', perServing: '2.1 g', vdPercent: '4%' },
        totalFat: { per100g: '6.0 g', perServing: '3.6 g', vdPercent: '5%' },
        saturatedFat: { per100g: '3.5 g', perServing: '2.1 g', vdPercent: '11%' },
        transFat: { per100g: '0 g', perServing: '0 g', vdPercent: '0%' },
        dietaryFiber: { per100g: '1.0 g', perServing: '0.6 g', vdPercent: '2%' },
        sodium: { per100g: '60 mg', perServing: '36 mg', vdPercent: '2%' },
      },
    });
    setSelectedFlavorId(created.id);
    setInsumosFlavorId(created.id);
    setConfigSelectedFlavorId(created.id);
    setIsNewFlavorModalOpen(false);
    setNewFlavorName('');
  };

  // Handle loss adjustment
  const handleConfirmLoss = () => {
    if (selectedLotForLoss && lossQtyInput > 0) {
      updateProductionLotQty(
        selectedLotForLoss.id,
        -lossQtyInput,
        lossReasonInput.trim() || 'Perda / Descarte interno'
      );
      setSelectedLotForLoss(null);
      setLossQtyInput(1);
      setLossReasonInput('');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-purple-600 selection:text-white">
      {/* 🧭 Dedicated Production Sidebar (Matching PDF Slide 1..15) */}
      <aside className="w-full lg:w-64 bg-slate-200/90 border-r border-slate-300/80 p-4 sm:p-5 shrink-0 flex flex-col justify-between select-none">
        <div className="space-y-4 lg:space-y-6">
          {/* Logo, Module Title & Exit on Mobile */}
          <div className="flex items-center justify-between lg:block">
            <div>
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-9 h-9 object-contain rounded-xl bg-white p-1 border border-slate-300 shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    ⚡
                  </div>
                )}
                <span className="font-bold text-slate-800 text-sm tracking-tight">
                  {settings.companyName || 'Sua Logo'}
                </span>
              </div>

              <div className="mt-2 lg:mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-200/90 text-purple-900 border border-purple-300 font-black text-xs uppercase tracking-wider shadow-2xs">
                <Factory className="w-3.5 h-3.5 text-purple-800" />
                <span>PRODUÇÃO</span>
              </div>
            </div>

            {/* Mobile Sair Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 bg-white/80 border border-slate-300 transition-all cursor-pointer shadow-2xs"
                title="Voltar ao sistema principal com tudo salvo"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Navigation Links (Início | Estoque | Insumos | Nota | Configuração | Sair) */}
          <nav className="flex flex-row lg:flex-col gap-1.5 lg:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'inicio', label: 'Início', icon: Factory },
              { id: 'estoque', label: 'Estoque', icon: Package },
              { id: 'insumos', label: 'Insumos', icon: Layers },
              { id: 'nota', label: 'Nota', icon: FileText },
              { id: 'configuracao', label: 'Configuração', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentSection(tab.id as any);
                    if (tab.id === 'inicio') {
                      setActiveProductionForm(null);
                    }
                  }}
                  className={`flex items-center gap-2 lg:gap-3 px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 lg:w-full ${
                    isActive
                      ? 'bg-slate-400/80 text-slate-900 shadow-2xs ring-1 ring-slate-400 font-extrabold'
                      : 'text-slate-700 hover:bg-slate-300/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-700" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Botão Sair Desktop (Volta para a página principal / Dashboard do sistema) */}
        <div className="hidden lg:block pt-6 border-t border-slate-300/80">
          <button
            onClick={() => setActiveView('dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
            title="Voltar ao sistema principal com tudo salvo"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ Main Production Content Area */}
      <main className="flex-1 p-5 sm:p-7 overflow-y-auto">
        {/* Banner de Sucesso */}
        {saveSuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: INÍCIO (REGISTRO DE PRODUÇÃO & GERAR LOTE) - Slides 1, 2, 3
           ========================================================================= */}
        {currentSection === 'inicio' && (
          <div className="space-y-6">
            {!activeProductionForm ? (
              /* Tela Inicial de Escolha: 2 Grandes Botões (Sorvete [Amarelo] e Açaí [Roxo]) - Slide 1 */
              <div className="max-w-4xl mx-auto space-y-8 pt-4">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    Registro de Produção & Lotes
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selecione o tipo de produto para registrar uma nova batelada, gerar o código do lote e abastecer o estoque:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
                  {/* Botão Sorvete (Amarelo, Slide 1) */}
                  <button
                    onClick={() => {
                      setActiveProductionForm('SORVETE');
                      setPackagingInput('Caixa');
                      setUnitMeasureInput('L');
                      setUnitPriceInput(75.0);
                    }}
                    className="group p-10 bg-amber-200 hover:bg-amber-300 text-slate-900 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-3xl shadow-2xs group-hover:scale-105 transition-transform">
                      🍨
                    </div>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                      sorvete
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Com seleção e gestão de sabores
                    </span>
                  </button>

                  {/* Botão Açaí (Roxo, Slide 1) */}
                  <button
                    onClick={() => {
                      setActiveProductionForm('ACAI');
                      setPackagingInput('Balde 10L');
                      setUnitMeasureInput('L');
                      setUnitPriceInput(75.0);
                    }}
                    className="group p-10 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500 text-white flex items-center justify-center font-bold text-3xl shadow-2xs group-hover:scale-105 transition-transform">
                      🍇
                    </div>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      Açaí
                    </span>
                    <span className="text-xs font-semibold text-purple-200">
                      Produção direta da base artesanal
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de Registro de Produção & Lote - Slides 2 e 3 */
              <div className="max-w-3xl mx-auto bg-slate-300/80 p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-400/50">
                  <button
                    onClick={() => setActiveProductionForm(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar à seleção</span>
                  </button>
                  <span className="text-xs font-black px-3 py-1 rounded-full uppercase bg-slate-400/50 text-slate-800">
                    {activeProductionForm === 'SORVETE' ? 'Sorvetes' : 'Açaí'}
                  </span>
                </div>

                <form onSubmit={handleSaveProduction} className="space-y-6">
                  {/* Título e Produto a Produzir (Slides 2 & 3) */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-600 block">
                      Registrar Produção & Gerar Lote
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Produto a Produzir:{' '}
                        {activeProductionForm === 'SORVETE' ? (
                          <span className="text-amber-700 font-extrabold">Sorvete : (sabor)</span>
                        ) : (
                          <span className="text-purple-800 font-extrabold">Açaí</span>
                        )}
                      </h3>

                      {/* Exibição do Formato do Código do Lote (Ex: S0001-01 ou Ex: A0001-01) */}
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">
                          Código do Lote (deixe em branco para gerar auto)
                        </span>
                        <span className="font-mono font-black text-sm text-slate-800">
                          Ex: {activeProductionForm === 'SORVETE' ? 'S0001-01' : 'A0001-01'} • Sugerido: <span className="text-indigo-700">{getAutoLotCodePreview(activeProductionForm)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seleção de Sabor (Apenas para Sorvete conforme Slide 2) */}
                  {activeProductionForm === 'SORVETE' && (
                    <div className="p-4 bg-white/80 rounded-2xl border border-slate-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Escolha o Sabor do Sorvete:
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsNewFlavorModalOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Cadastrar Novo Sabor</span>
                        </button>
                      </div>

                      <select
                        value={selectedFlavorId}
                        onChange={(e) => setSelectedFlavorId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                      >
                        {flavors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.allergens || 'Alérgenos configurados'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Campo de Código do Lote Manual ou Automático */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código do Lote (SDDMM-NN para sorvete, ADDMM-NN para açaí):
                    </label>
                    <input
                      type="text"
                      placeholder={`Deixe em branco para usar o automático: ${getAutoLotCodePreview(activeProductionForm)}`}
                      value={lotCodeInput}
                      onChange={(e) => setLotCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 placeholder:font-normal focus:border-indigo-600 focus:outline-hidden"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      * O primeiro dígito representa o produto (S=Sorvete, A=Açaí), os 4 números seguintes o dia e mês (DDMM) e após o traço a sequência do dia (ex: 01, 02).
                    </span>
                  </div>

                  {/* Embalagem, Litro/Quilo e Quantidade Produzida (Slides 2 & 3) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        embalagem:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Caixa, Pote, Tapuer, Balde"
                        value={packagingInput}
                        onChange={(e) => setPackagingInput(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:border-indigo-600 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Litro ou kilo:
                      </label>
                      <select
                        value={unitMeasureInput}
                        onChange={(e) => setUnitMeasureInput(e.target.value as any)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold focus:border-indigo-600 focus:outline-hidden"
                      >
                        <option value="L">Litros (L)</option>
                        <option value="kg">Quilos (kg)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantidade Produzida:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={qtyInput || ''}
                        onChange={(e) => setQtyInput(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-indigo-700 focus:border-indigo-600 focus:outline-hidden"
                        placeholder="Ex: 50"
                        required
                      />
                    </div>
                  </div>

                  {/* Data de Fabricação e Data de Validade (Preenchidas Automaticamente - Slides 2 & 3) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Data de Fabricação (hoje):
                      </label>
                      <input
                        type="date"
                        value={mfgDateInput}
                        onChange={(e) => {
                          setMfgDateInput(e.target.value);
                          if (e.target.value) {
                            const d = new Date(e.target.value);
                            d.setDate(d.getDate() + 365);
                            setExpDateInput(d.toISOString().split('T')[0]);
                          }
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Data de Validade (+365 dias):
                      </label>
                      <input
                        type="date"
                        value={expDateInput}
                        onChange={(e) => setExpDateInput(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Valor Unitário de Venda (R$):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={unitPriceInput || ''}
                        onChange={(e) => setUnitPriceInput(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Observações (Slide 2 & 3) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observações:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Campo opcional em branco para observações da calda, turno, textura ou lote..."
                      value={obsInput}
                      onChange={(e) => setObsInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Botão SALVAR (Slide 2 & 3) */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-8 py-3 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 tracking-wider uppercase"
                    >
                      SALVAR
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 2: ESTOQUE DA PRODUÇÃO - Slides 4 e 5
           ========================================================================= */}
        {currentSection === 'estoque' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Estoque Interno da Produção
                </h3>
                <p className="text-xs text-slate-500">
                  Visualização dos lotes produzidos. Todos os lotes criados aqui são integrados automaticamente ao estoque geral do sistema.
                </p>
              </div>

              <button
                onClick={() => {
                  setCurrentSection('inicio');
                  setActiveProductionForm(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nova Produção</span>
              </button>
            </div>

            {/* Lista dos Lotes em Estoque (Cards conforme Slides 4 e 5) */}
            {productionLots.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700">Nenhum lote no estoque da produção</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Vá até a aba Início e registre a primeira batelada de Sorvete ou Açaí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {productionLots.map((lot) => {
                  const isIceCream = lot.productType === 'SORVETE';
                  return (
                    <div
                      key={lot.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-colors"
                    >
                      {/* Top Header do Card: Ícone Caixa + Nome + Quantidade (Slides 4 e 5) */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-2xs ${
                              isIceCream ? 'bg-amber-500' : 'bg-purple-600'
                            }`}
                          >
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {isIceCream ? `Sorvete: ( ${lot.flavorName || 'Sabor'} )` : 'Açaí'}
                            </h4>
                            <span className="text-xs font-semibold text-slate-500">
                              Quantidade: <strong className="text-slate-800">{lot.quantity}</strong> unidades ({lot.packaging} de {lot.unitMeasure})
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-xl ${
                            isIceCream
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {lot.productType}
                        </span>
                      </div>

                      {/* Grade de Especificações: LOTE | FABRICAÇÃO | VALIDADE | OBS | Valor R$ (Slides 4 e 5) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {/* LOTE */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            LOTE
                          </span>
                          <span className="text-sm font-black font-mono text-slate-900 block mt-0.5">
                            {lot.lotNumber}
                          </span>
                        </div>

                        {/* FABRICAÇÃO */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            FABRICAÇÃO
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                            {formatDate(lot.manufacturingDate)}
                          </span>
                        </div>

                        {/* VALIDADE */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            VALIDADE
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                            {formatDate(lot.expiryDate)}
                          </span>
                        </div>

                        {/* Valor: R$ */}
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Valor Unitário
                          </span>
                          <span className="text-xs font-black text-indigo-700 block mt-0.5">
                            {formatCurrency(lot.unitPrice)}
                          </span>
                        </div>
                      </div>

                      {/* OBS */}
                      <div className="text-xs text-slate-600">
                        <strong className="text-slate-700">OBS:</strong> {lot.observations || 'Sem observações adicionais.'}
                      </div>

                      {/* 3 Botões de Ação Exatos dos Slides 4 e 5:
                          1. Ver informações do lote
                          2. Ajustar Quantidade / Perda
                          3. Rastrear Lote */}
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedLotForLabel(lot)}
                          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Exibir rótulo oficial e tabela nutricional para impressão"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver informações do lote</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLotForLoss(lot);
                            setLossQtyInput(1);
                            setLossReasonInput('');
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ajustar Quantidade / Perda</span>
                        </button>

                        <button
                          onClick={() => setSelectedLotForTrack(lot)}
                          className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Rastrear Lote</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 3: INSUMOS (GESTÃO DE RECEITAS & INSUMOS) - Slides 6, 7, 8
           ========================================================================= */}
        {currentSection === 'insumos' && (
          <div className="space-y-6">
            {/* Seletor Sorvete / Açaí (Slide 6) */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
                Linha de Produção:
              </span>
              <button
                onClick={() => setInsumosSubTab('SORVETE')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  insumosSubTab === 'SORVETE'
                    ? 'bg-amber-300 text-slate-900 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                sorvete
              </button>
              <button
                onClick={() => setInsumosSubTab('ACAI')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  insumosSubTab === 'ACAI'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Açaí
              </button>
            </div>

            {insumosSubTab === 'SORVETE' ? (
              /* Insumos Sorvete: Calda Base + Sabor Utilizados (Slide 7) */
              <div className="space-y-6">
                {/* Quadro 1: Ingredientes & Insumos Utilizados (Calda Base) - Slide 7 */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-800">
                        Ingredientes & Insumos Utilizados ( Calda Base )
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Ingredientes padrão que compõem a calda base de todos os sorvetes
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                      {baseIceCreamIngredients.length} ingredientes
                    </span>
                  </div>

                  {/* Lista de Insumos da Calda Base */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {baseIceCreamIngredients.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setBaseIceCreamIngredients((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inputs para Adicionar Insumo à Calda Base (Slide 7) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="Nome do insumo/ingrediente"
                        value={newBaseIngName}
                        onChange={(e) => setNewBaseIngName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Qtd (ex: 50kg)"
                        value={newBaseIngQty}
                        onChange={(e) => setNewBaseIngQty(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddBaseIngredient}
                        className="w-full py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quadro 2: Sabor utilizados: ( SABOR ) - Slide 7 */}
                <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-800">
                        Sabor utilizados:
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={insumosFlavorId}
                          onChange={(e) => setInsumosFlavorId(e.target.value)}
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-hidden"
                        >
                          {flavors.map((f) => (
                            <option key={f.id} value={f.id}>
                              ( {f.name.toUpperCase()} )
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => setIsNewFlavorModalOpen(true)}
                          className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-300 rounded-xl cursor-pointer"
                        >
                          + Novo Sabor
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Valor unitário: R$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={
                          flavors.find((f) => f.id === insumosFlavorId)?.unitCost || flavorUnitCostInput
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFlavorUnitCostInput(val);
                          updateFlavor(insumosFlavorId, { unitCost: val });
                        }}
                        className="w-24 px-2 py-1 text-xs font-black bg-white border border-amber-300 rounded-xl text-slate-900 text-right"
                      />
                    </div>
                  </div>

                  {/* Lista de Insumos do Sabor Selecionado */}
                  {(() => {
                    const currentFlavor = flavors.find((f) => f.id === insumosFlavorId);
                    const list = currentFlavor?.ingredients || [];
                    return (
                      <div className="space-y-3">
                        <div className="divide-y divide-amber-100 border border-amber-200 bg-white rounded-2xl overflow-hidden">
                          {list.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              Nenhum insumo específico associado a este sabor ainda. Adicione abaixo (ex: calda de chocolate, frutas, raspas).
                            </div>
                          ) : (
                            list.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 hover:bg-amber-50/50 flex items-center justify-between text-xs"
                              >
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = list.filter((_, i) => i !== idx);
                                      updateFlavor(insumosFlavorId, { ingredients: updated });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Inputs para Adicionar Insumo do Sabor (Slide 7) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                          <div className="sm:col-span-7">
                            <input
                              type="text"
                              placeholder="Nome do insumo/ingrediente (ex: Calda de Chocolate, Frutas)"
                              value={newFlavorIngName}
                              onChange={(e) => setNewFlavorIngName(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:border-amber-600 focus:outline-hidden"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Qtd (ex: 50kg)"
                              value={newFlavorIngQty}
                              onChange={(e) => setNewFlavorIngQty(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:border-amber-600 focus:outline-hidden"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddFlavorIngredient}
                              className="w-full py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl cursor-pointer"
                            >
                              + Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSaveSuccessMessage('✓ Insumos e receita do sorvete atualizados com sucesso!');
                        setTimeout(() => setSaveSuccessMessage(null), 2500);
                      }}
                      className="px-6 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer tracking-wider uppercase"
                    >
                      cadastrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Insumos Açaí: Base Única de Açaí (Slide 8) */
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-800">
                      Ingredientes & Insumos Utilizados ( Base Açaí )
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Insumos diretos da produção de açaí artesanal
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Valor unitário: R$</span>
                    <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                      R$ 42,00
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {baseAcaiIngredients.map((item, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBaseAcaiIngredients((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inputs para Adicionar Insumo do Açaí (Slide 8) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      placeholder="Nome do insumo/ingrediente (ex: Polpa de açaí, Xarope)"
                      value={newBaseIngName}
                      onChange={(e) => setNewBaseIngName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Qtd (ex: 50kg)"
                      value={newBaseIngQty}
                      onChange={(e) => setNewBaseIngQty(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddBaseIngredient}
                      className="w-full py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveSuccessMessage('✓ Insumos da base de açaí salvos com sucesso!');
                      setTimeout(() => setSaveSuccessMessage(null), 2500);
                    }}
                    className="px-6 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer tracking-wider uppercase"
                  >
                    Cadastrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 4: NOTA (BLOCO DE NOTAS DA PRODUÇÃO) - Slide 9
           ========================================================================= */}
        {currentSection === 'nota' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Bloco de Notas da Produção</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Espaço reservado para você registrar anotações, lembretes de turno, controle de temperatura e observações das bateladas.
                </p>
              </div>

              {/* Criar / Editar Nota */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  placeholder="Escreva sua anotação aqui..."
                  value={editingNoteId ? editingNoteContent : noteInput}
                  onChange={(e) =>
                    editingNoteId
                      ? setEditingNoteContent(e.target.value)
                      : setNoteInput(e.target.value)
                  }
                  className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-600 focus:outline-hidden"
                />

                <div className="flex justify-end gap-2">
                  {editingNoteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(null);
                        setEditingNoteContent('');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (editingNoteId) {
                        updateProductionNote(editingNoteId, editingNoteContent);
                        setEditingNoteId(null);
                        setEditingNoteContent('');
                      } else if (noteInput.trim()) {
                        addProductionNote(noteInput);
                        setNoteInput('');
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs"
                  >
                    {editingNoteId ? 'Salvar Alteração' : 'Adicionar Anotação'}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Notas Cadastradas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico de Anotações ({productionNotes.length})
              </h4>

              {productionNotes.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  Nenhuma anotação registrada ainda.
                </div>
              ) : (
                productionNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-indigo-700">
                        <Clock className="w-3.5 h-3.5" />
                        {note.createdAt}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingNoteContent(note.content);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          title="Editar anotação"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProductionNote(note.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Excluir anotação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 5: CONFIGURAÇÃO (EMBALAGENS, SABORES & TABELA NUTRICIONAL ANVISA)
            Slides 10, 11, 12, 13, 14
           ========================================================================= */}
        {currentSection === 'configuracao' && (
          <div className="space-y-6">
            {/* 3 Abas no Topo: Sorvete | Sabores | Açaí (Slides 12, 13, 14) */}
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
              <button
                onClick={() => setConfigSubTab('sorvete')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                  configSubTab === 'sorvete'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sorvete
              </button>
              <button
                onClick={() => setConfigSubTab('sabores')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                  configSubTab === 'sabores'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sabores
              </button>
              <button
                onClick={() => setConfigSubTab('acai')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
                  configSubTab === 'acai'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Açaí
              </button>
            </div>

            {/* ABA 1: SORVETE (Configuração da Embalagem / Rótulo Padrão - Slide 12) */}
            {configSubTab === 'sorvete' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 max-w-4xl">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-800">
                    Configuração da Embalagem e Rótulo • Sorvete
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina os dados oficiais da empresa e advertências obrigatórias que serão impressas nos rótulos de sorvete.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Fabricado e Distribuído por:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.manufacturer}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: { ...productionLabelSettings.sorvete, manufacturer: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNPJ:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.cnpj}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: { ...productionLabelSettings.sorvete, cnpj: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Inscrição Estadual:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.stateRegistration}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: {
                            ...productionLabelSettings.sorvete,
                            stateRegistration: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contato / SAC:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.contact}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: { ...productionLabelSettings.sorvete, contact: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.address}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: { ...productionLabelSettings.sorvete, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Conteúdo Líquido Padrão:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.defaultNetContent}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: {
                            ...productionLabelSettings.sorvete,
                            defaultNetContent: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Regra de Validade:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.validityText}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: {
                            ...productionLabelSettings.sorvete,
                            validityText: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Glúten:</label>
                    <select
                      value={productionLabelSettings.sorvete.glutenText}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: { ...productionLabelSettings.sorvete, glutenText: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="CONTÉM GLÚTEN">CONTÉM GLÚTEN</option>
                      <option value="NÃO CONTÉM GLÚTEN">NÃO CONTÉM GLÚTEN</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Alérgenos Padrão da Base de Sorvete:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.sorvete.baseAllergens}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: {
                            ...productionLabelSettings.sorvete,
                            baseAllergens: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Ingredientes da Calda Base para Rotulagem:
                    </label>
                    <textarea
                      rows={3}
                      value={productionLabelSettings.sorvete.baseIngredients}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          sorvete: {
                            ...productionLabelSettings.sorvete,
                            baseIngredients: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveSuccessMessage('✓ Configurações do rótulo de sorvete salvas com sucesso!');
                      setTimeout(() => setSaveSuccessMessage(null), 2500);
                    }}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                  >
                    Salvar Dados do Sorvete
                  </button>
                </div>
              </div>
            )}

            {/* ABA 2: SABORES (Tabela Nutricional & Alérgenos por Sabor - Slide 13) */}
            {configSubTab === 'sabores' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Coluna da Esquerda: Cadastrados (Slide 13) */}
                <div className="lg:col-span-4 bg-slate-300/80 p-5 rounded-3xl border border-slate-300 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-400/50">
                    <h4 className="text-sm font-extrabold text-slate-900">Cadastrados</h4>
                    <button
                      type="button"
                      onClick={() => setIsNewFlavorModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      + Novo
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {flavors.map((f) => {
                      const isSelected = configSelectedFlavorId === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => setConfigSelectedFlavorId(f.id)}
                          className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-2xs font-bold'
                              : 'bg-white/80 hover:bg-white text-slate-800'
                          }`}
                        >
                          <span className="text-xs truncate">{f.name}</span>
                          {flavors.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFlavor(f.id);
                                if (configSelectedFlavorId === f.id) {
                                  const remaining = flavors.filter((x) => x.id !== f.id);
                                  if (remaining[0]) setConfigSelectedFlavorId(remaining[0].id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                              title="Excluir sabor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna da Direita: INFORMAÇÃO NUTRICIONAL & Alergênicos contém (Slide 13) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  {(() => {
                    const currentFlavor =
                      flavors.find((f) => f.id === configSelectedFlavorId) || flavors[0];

                    if (!currentFlavor) return null;

                    return (
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-slate-400 block">
                              Informação Nutricional do Sabor:
                            </span>
                            <h3 className="text-lg font-black text-slate-900">
                              {currentFlavor.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Porção:</span>
                            <input
                              type="text"
                              value={currentFlavor.nutritionTable.servingSize}
                              onChange={(e) =>
                                updateFlavor(currentFlavor.id, {
                                  nutritionTable: {
                                    ...currentFlavor.nutritionTable,
                                    servingSize: e.target.value,
                                  },
                                })
                              }
                              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                            />
                          </div>
                        </div>

                        {/* Tabela Nutricional ANVISA (Slide 13) */}
                        <div className="border border-slate-300 rounded-2xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                              <tr>
                                <th className="p-2.5">INFORMAÇÃO NUTRICIONAL</th>
                                <th className="p-2.5 w-24 text-center">100 g</th>
                                <th className="p-2.5 w-24 text-center">
                                  {currentFlavor.nutritionTable.servingSize.split(' ')[0] || '60 g'}
                                </th>
                                <th className="p-2.5 w-20 text-center">%VD*</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-800">
                              {[
                                { key: 'energeticValue', label: 'Valor energético (kcal)' },
                                { key: 'carbohydrates', label: 'Carboidratos (g)' },
                                { key: 'totalSugars', label: 'Açúcares totais (g)' },
                                { key: 'addedSugars', label: 'Açúcares adicionados (g)' },
                                { key: 'proteins', label: 'Proteínas (g)' },
                                { key: 'totalFat', label: 'Gorduras totais (g)' },
                                { key: 'saturatedFat', label: 'Gorduras saturadas (g)' },
                                { key: 'transFat', label: 'Gorduras trans (g)' },
                                { key: 'dietaryFiber', label: 'Fibras alimentares (g)' },
                                { key: 'sodium', label: 'Sódio (mg)' },
                              ].map((row) => {
                                const rowKey = row.key as keyof typeof currentFlavor.nutritionTable;
                                const rowVal = (currentFlavor.nutritionTable[rowKey] as any) || {
                                  per100g: '',
                                  perServing: '',
                                  vdPercent: '',
                                };

                                return (
                                  <tr key={row.key} className="hover:bg-slate-50">
                                    <td className="p-2 font-medium">{row.label}</td>
                                    <td className="p-1.5 text-center">
                                      <input
                                        type="text"
                                        value={rowVal.per100g || ''}
                                        onChange={(e) => {
                                          updateFlavor(currentFlavor.id, {
                                            nutritionTable: {
                                              ...currentFlavor.nutritionTable,
                                              [rowKey]: { ...rowVal, per100g: e.target.value },
                                            },
                                          });
                                        }}
                                        className="w-full text-center py-1 text-xs bg-slate-50 border border-slate-200 rounded font-semibold"
                                      />
                                    </td>
                                    <td className="p-1.5 text-center">
                                      <input
                                        type="text"
                                        value={rowVal.perServing || ''}
                                        onChange={(e) => {
                                          updateFlavor(currentFlavor.id, {
                                            nutritionTable: {
                                              ...currentFlavor.nutritionTable,
                                              [rowKey]: { ...rowVal, perServing: e.target.value },
                                            },
                                          });
                                        }}
                                        className="w-full text-center py-1 text-xs bg-slate-50 border border-slate-200 rounded font-semibold"
                                      />
                                    </td>
                                    <td className="p-1.5 text-center">
                                      <input
                                        type="text"
                                        value={rowVal.vdPercent || ''}
                                        onChange={(e) => {
                                          updateFlavor(currentFlavor.id, {
                                            nutritionTable: {
                                              ...currentFlavor.nutritionTable,
                                              [rowKey]: { ...rowVal, vdPercent: e.target.value },
                                            },
                                          });
                                        }}
                                        className="w-full text-center py-1 text-xs bg-slate-50 border border-slate-200 rounded font-semibold"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Alergênicos contém (Slide 13) */}
                        <div className="p-4 bg-slate-300/80 rounded-2xl border border-slate-300 space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Alergênicos contém:
                          </label>
                          <textarea
                            rows={2}
                            value={currentFlavor.allergens}
                            onChange={(e) =>
                              updateFlavor(currentFlavor.id, { allergens: e.target.value })
                            }
                            placeholder="Ex: CONTÉM DERIVADOS DE LEITE E SOJA. PODE CONTER AMENDOIM, TRIGO E CASTANHAS."
                            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-slate-900 focus:outline-hidden"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSaveSuccessMessage(`✓ Dados nutricionais e alérgenos de ${currentFlavor.name} salvos!`);
                              setTimeout(() => setSaveSuccessMessage(null), 2500);
                            }}
                            className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                          >
                            Salvar Alterações do Sabor
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ABA 3: AÇAÍ (Configuração do Rótulo & Informação Nutricional - Slide 14) */}
            {configSubTab === 'acai' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 max-w-4xl">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-800">
                    Configuração da Embalagem e Rótulo • Açaí
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina os dados da empresa, rotulagem e tabela nutricional oficial voltados para a linha de açaí.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Fabricado e Distribuído por:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.manufacturer}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, manufacturer: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CNPJ:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.cnpj}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, cnpj: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Inscrição Estadual:
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.stateRegistration}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: {
                            ...productionLabelSettings.acai,
                            stateRegistration: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contato:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.contact}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, contact: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.address}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Glúten:</label>
                    <select
                      value={productionLabelSettings.acai.glutenText}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, glutenText: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="NÃO CONTÉM GLÚTEN">NÃO CONTÉM GLÚTEN</option>
                      <option value="CONTÉM GLÚTEN">CONTÉM GLÚTEN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Alérgicos (Pode preencher diretamente):
                    </label>
                    <input
                      type="text"
                      value={productionLabelSettings.acai.allergens}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, allergens: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Lista de Ingredientes do Açaí:
                    </label>
                    <textarea
                      rows={2}
                      value={productionLabelSettings.acai.ingredients}
                      onChange={(e) =>
                        updateProductionLabelSettings({
                          acai: { ...productionLabelSettings.acai, ingredients: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSaveSuccessMessage('✓ Configurações do rótulo de açaí salvas com sucesso!');
                      setTimeout(() => setSaveSuccessMessage(null), 2500);
                    }}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl cursor-pointer"
                  >
                    Salvar Dados do Açaí
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: VER INFORMAÇÃO DO LOTE / ETIQUETA OFICIAL DE IMPRESSÃO
          Slides 10 e 11
         ========================================================================= */}
      {selectedLotForLabel && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLotForLabel(null)}
          title={`Informação do LOTE • ${selectedLotForLabel.lotNumber}`}
        >
          {(() => {
            const isIceCream = selectedLotForLabel.productType === 'SORVETE';
            const iceCreamCfg = productionLabelSettings.sorvete;
            const acaiCfg = productionLabelSettings.acai;
            const cfg = isIceCream ? iceCreamCfg : acaiCfg;

            // Encontrar sabor correspondente se for sorvete
            const matchedFlavor = isIceCream
              ? flavors.find((f) => f.name.toLowerCase() === selectedLotForLabel.flavorName?.toLowerCase()) ||
                flavors[0]
              : null;

            const nutrition = isIceCream
              ? matchedFlavor?.nutritionTable
              : productionLabelSettings.acai.nutritionTable;

            const allergensText = isIceCream
              ? `${iceCreamCfg.baseAllergens} ${matchedFlavor?.allergens || ''}`.trim()
              : acaiCfg.allergens;

            return (
              <div className="space-y-6 text-xs text-slate-900">
                {/* Visual da Etiqueta / Rótulo Oficial (Exato dos Slides 10 e 11) */}
                <div
                  id="print-label-area"
                  className="p-5 sm:p-6 bg-white border-2 border-slate-800 rounded-2xl space-y-4 shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Coluna 1: Informações Cadastrais e Rótulo (Slides 10 e 11) */}
                    <div className="md:col-span-6 space-y-1.5 leading-relaxed text-[11px]">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">
                        {isIceCream ? 'SORVETE' : 'Açaí'}
                      </h4>
                      <p>
                        <strong>Fabricado e Distribuído por:</strong> {cfg.manufacturer}
                      </p>
                      <p>
                        <strong>Endereço:</strong> {cfg.address}
                      </p>
                      <p>
                        <strong>CNPJ:</strong> {cfg.cnpj}
                      </p>
                      <p>
                        <strong>Inscrição Estadual:</strong> {cfg.stateRegistration}
                      </p>
                      <p>
                        • <strong>Contato:</strong> {cfg.contact}
                      </p>
                      <p>
                        • <strong>{cfg.originText || 'INDÚSTRIA BRASILEIRA'}</strong>
                      </p>
                      <p className="pt-1 font-bold">
                        • NOME DO PRODUTO:{' '}
                        {isIceCream
                          ? `SORVETE SABOR ${selectedLotForLabel.flavorName || '[Inserir sabor]'}`
                          : 'Açaí Tradicional'}
                      </p>
                      <p>
                        • <strong>CONTEÚDO LÍQUIDO:</strong> {selectedLotForLabel.packaging} de{' '}
                        {selectedLotForLabel.unitMeasure}
                      </p>
                      <p className="font-mono">
                        • <strong>LOTE:</strong> {selectedLotForLabel.lotNumber}
                      </p>
                      <p>
                        • <strong>Fabricado em:</strong>{' '}
                        {formatDate(selectedLotForLabel.manufacturingDate)}
                      </p>
                      <p>
                        • <strong>VALIDADE:</strong> 12 MESES APOS FABRICAÇÃO ({formatDate(selectedLotForLabel.expiryDate)})
                      </p>
                      <p className="pt-1">
                        • <strong>Ingredientes:</strong>{' '}
                        {isIceCream
                          ? `${iceCreamCfg.baseIngredients} ${matchedFlavor?.ingredients.map((i) => i.name).join(', ') || ''}`
                          : acaiCfg.ingredients}
                      </p>
                      <p>
                        • <strong>Glúten:</strong> {cfg.glutenText}
                      </p>
                      <p className="text-rose-700 font-bold">
                        • <strong>ALÉRGICOS:</strong> {allergensText}
                      </p>
                    </div>

                    {/* Coluna 2: Tabela de Informação Nutricional ANVISA (Slides 10 e 11) */}
                    <div className="md:col-span-6 border-2 border-slate-900 rounded-xl overflow-hidden bg-white">
                      <div className="p-2 border-b-2 border-slate-900 bg-slate-50 text-center">
                        <span className="font-black text-xs uppercase tracking-tight block">
                          INFORMAÇÃO NUTRICIONAL
                        </span>
                        <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                          <span>Porções por embalagem: {nutrition?.servingsPerPackage || '20'}</span>
                          <span>Porção: {nutrition?.servingSize || '60 g'}</span>
                        </div>
                      </div>

                      <table className="w-full text-[10px] leading-tight">
                        <thead className="border-b border-slate-900 font-bold bg-slate-100">
                          <tr>
                            <th className="p-1.5 text-left">Componente</th>
                            <th className="p-1.5 w-14 text-center">100 g</th>
                            <th className="p-1.5 w-14 text-center">Porção</th>
                            <th className="p-1.5 w-12 text-center">%VD*</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {nutrition &&
                            [
                              { item: nutrition.energeticValue, label: 'Valor energético (kcal)' },
                              { item: nutrition.carbohydrates, label: 'Carboidratos (g)' },
                              { item: nutrition.totalSugars, label: 'Açúcares totais (g)' },
                              { item: nutrition.addedSugars, label: 'Açúcares adicionados (g)' },
                              { item: nutrition.proteins, label: 'Proteínas (g)' },
                              { item: nutrition.totalFat, label: 'Gorduras totais (g)' },
                              { item: nutrition.saturatedFat, label: 'Gorduras saturadas (g)' },
                              { item: nutrition.transFat, label: 'Gorduras trans (g)' },
                              { item: nutrition.dietaryFiber, label: 'Fibras alimentares (g)' },
                              { item: nutrition.sodium, label: 'Sódio (mg)' },
                            ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-1 font-medium">{row.label}</td>
                                <td className="p-1 text-center font-semibold">{row.item?.per100g || '-'}</td>
                                <td className="p-1 text-center font-semibold">{row.item?.perServing || '-'}</td>
                                <td className="p-1 text-center font-bold">{row.item?.vdPercent || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <div className="p-1 text-[8px] text-slate-500 text-center border-t border-slate-300">
                        *Percentual de valores diários fornecidos pela porção.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações do Modal: Fechar, Baixar e Imprimir (Slide 10 & 11) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Etiqueta pronta em padrão térmico/gráfica para rotulagem.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLotForLabel(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                      >
                        Fechar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPrintableFile({
                            title: `Etiqueta-${selectedLotForLabel.lotNumber}`,
                            elementId: 'print-label-area',
                            filename: `etiqueta-lote-${selectedLotForLabel.lotNumber}.html`,
                          })
                        }
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Baixar arquivo HTML da etiqueta para imprimir a qualquer momento"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                        <span>Baixar Arquivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          triggerPrint({
                            title: `Etiqueta Lote ${selectedLotForLabel.lotNumber} - ${isIceCream ? selectedLotForLabel.flavorName : 'Açaí'}`,
                            elementId: 'print-label-area',
                          })
                        }
                        className="px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir Etiqueta</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    💡 <strong>Impressão sem bloqueio:</strong> Ao clicar em <em>Imprimir Etiqueta</em>, o sistema abre a página de impressão formatada em nova guia e chama a sua impressora. Se o navegador travar o diálogo direto, use o botão <em>Baixar Arquivo</em> para abrir e imprimir diretamente.
                  </p>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* =========================================================================
          MODAL: AJUSTAR QUANTIDADE / PERDA
         ========================================================================= */}
      {selectedLotForLoss && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLotForLoss(null)}
          title={`Ajustar Quantidade de Perda • Lote ${selectedLotForLoss.lotNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <div>
                <span className="text-slate-500">Produto:</span>
                <strong className="block text-slate-900">
                  {selectedLotForLoss.productType === 'SORVETE'
                    ? `Sorvete ${selectedLotForLoss.flavorName}`
                    : 'Açaí'}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Saldo Atual:</span>
                <strong className="block text-indigo-700 font-black">
                  {selectedLotForLoss.quantity} unidades
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade de Descarte / Perda a dar baixa:
              </label>
              <input
                type="number"
                min="1"
                max={selectedLotForLoss.quantity}
                value={lossQtyInput || ''}
                onChange={(e) => setLossQtyInput(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-rose-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo da Perda (texto livre):
              </label>
              <input
                type="text"
                placeholder="Ex: Pote quebrado na esteira, variação térmica, descarte de teste"
                value={lossReasonInput}
                onChange={(e) => setLossReasonInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLotForLoss(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLoss}
                disabled={lossQtyInput <= 0}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Confirmar Perda (-{lossQtyInput} un)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: RASTREAR LOTE
         ========================================================================= */}
      {selectedLotForTrack && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLotForTrack(null)}
          title={`Rastreio Interno do Lote • ${selectedLotForTrack.lotNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Lote:</span>
                <strong className="font-mono text-slate-900">{selectedLotForTrack.lotNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produto:</span>
                <strong className="text-slate-900">
                  {selectedLotForTrack.productType === 'SORVETE'
                    ? `Sorvete ${selectedLotForTrack.flavorName}`
                    : 'Açaí'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data de Fabricação:</span>
                <span>{formatDate(selectedLotForTrack.manufacturingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validade:</span>
                <span>{formatDate(selectedLotForTrack.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Embalagem:</span>
                <span>{selectedLotForTrack.packaging} ({selectedLotForTrack.unitMeasure})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estoque Atual na Fábrica:</span>
                <strong className="text-indigo-700">{selectedLotForTrack.quantity} un</strong>
              </div>
            </div>

            <p className="text-slate-600">
              Este lote está integrado ao catálogo comercial e disponível para expedição e vendas nos pedidos.
            </p>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedLotForTrack(null);
                  setActiveView('rastreamento');
                }}
                className="px-4 py-2 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer"
              >
                Abrir Central de Rastreabilidade Geral →
              </button>
              <button
                type="button"
                onClick={() => setSelectedLotForTrack(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: CADASTRAR NOVO SABOR
         ========================================================================= */}
      {isNewFlavorModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewFlavorModalOpen(false)}
          title="Cadastrar Novo Sabor de Sorvete"
        >
          <form onSubmit={handleCreateNewFlavor} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome do Sabor:</label>
              <input
                type="text"
                placeholder="Ex: Maracujá, Pistache, Doce de Leite, Napolitano"
                value={newFlavorName}
                onChange={(e) => setNewFlavorName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alérgenos e advertências do sabor:
              </label>
              <input
                type="text"
                value={newFlavorAllergens}
                onChange={(e) => setNewFlavorAllergens(e.target.value)}
                placeholder="Ex: CONTÉM DERIVADOS DE LEITE E SOJA."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewFlavorModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs"
              >
                Cadastrar Sabor
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
