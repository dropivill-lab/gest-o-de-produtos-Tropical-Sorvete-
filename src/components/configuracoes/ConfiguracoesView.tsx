import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  Sliders,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  Check,
  Shield,
  CreditCard,
  QrCode,
  Trash2,
  AlertTriangle,
  Sparkles,
  Image as ImageIcon,
  Edit2,
  Package,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, Customer, Product } from '../../types';
import { Modal } from '../common/Modal';

export const ConfiguracoesView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    clearAllData,
    isDemoMode,
    currentUserRole,
    setCurrentUserRole,
    customers,
    products,
    deleteCustomer,
    deleteProduct,
    setActiveView,
    setTargetClientForCreditLimitEdit,
    setTargetLotForAdjust,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<
    'empresa' | 'clientes' | 'estoque' | 'usuarios' | 'regras' | 'backup'
  >('empresa');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [keepCatalogChoice, setKeepCatalogChoice] = useState(false);

  // Form states for Empresa (Slide 10 + Logo)
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [tradeName, setTradeName] = useState(settings.tradeName);
  const [cnpj, setCnpj] = useState(settings.cnpj);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [pixKey, setPixKey] = useState(settings.pixKey);
  const [pixKeyType, setPixKeyType] = useState(settings.pixKeyType);
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');

  // Synchronize local states if global settings change
  useEffect(() => {
    setLogoUrl(settings.logoUrl || '');
    setCompanyName(settings.companyName);
    setTradeName(settings.tradeName);
    setCnpj(settings.cnpj);
    setAddress(settings.address);
    setPhone(settings.phone);
    setEmail(settings.email);
    setPixKey(settings.pixKey);
    setPixKeyType(settings.pixKeyType);
  }, [settings]);

  // Delete Customer confirmation modal state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Delete Product confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Regras Automáticas (Slide 11)
  const [defaultCardFee, setDefaultCardFee] = useState(settings.defaultCardFee);
  const [defaultCreditLimit, setDefaultCreditLimit] = useState(settings.defaultCreditLimit);
  const [blockDelinquent, setBlockDelinquent] = useState(settings.blockDelinquentCustomers);
  const [alertDaysBeforeExpiry, setAlertDaysBeforeExpiry] = useState(settings.alertDaysBeforeExpiry);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload com compressão Canvas inteligente (< 30KB) e salvamento automático imediato!
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para tamanho ideal de logo (máx 256x256) garantindo persistência sem estouro de cota
        const maxDim = 256;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          let compressed = '';
          try {
            compressed = canvas.toDataURL('image/webp', 0.85);
          } catch {
            compressed = canvas.toDataURL('image/jpeg', 0.85);
          }
          setLogoUrl(compressed);
          // Salva IMEDIATAMENTE no AppContext e localStorage!
          updateSettings({ logoUrl: compressed });
          setLogoSaveSuccess(true);
          setTimeout(() => setLogoSaveSuccess(false), 3000);
        } else {
          const raw = event.target?.result as string;
          setLogoUrl(raw);
          updateSettings({ logoUrl: raw });
          setLogoSaveSuccess(true);
          setTimeout(() => setLogoSaveSuccess(false), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateSettings({ logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLogoSaveSuccess(true);
    setTimeout(() => setLogoSaveSuccess(false), 2500);
  };

  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      tradeName,
      cnpj,
      address,
      phone,
      email,
      pixKey,
      pixKeyType,
      logoUrl,
      defaultCardFee: Number(defaultCardFee),
      defaultCreditLimit: Number(defaultCreditLimit),
      blockDelinquentCustomers: blockDelinquent,
      alertDaysBeforeExpiry: Number(alertDaysBeforeExpiry),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleConfirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const handleConfirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const handleEditCustomerCreditLimit = (c: Customer) => {
    setTargetClientForCreditLimitEdit(c.id);
    setActiveView('clientes');
  };

  const handleEditProductStockAdjust = (p: Product) => {
    setTargetLotForAdjust(p.id);
    setActiveView('estoque');
  };

  const rolesMatrix = [
    {
      role: 'ADMINISTRADOR',
      title: 'Administrador Geral',
      permissions: ['Tudo', 'Acesso total a todos os módulos, cadastros, relatórios e configurações'],
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      role: 'FINANCEIRO',
      title: 'Financeiro',
      permissions: ['Financeiro', 'Clientes', 'Contas a receber', 'Cobrança WhatsApp e fluxo de caixa'],
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      role: 'PRODUCAO',
      title: 'Produção',
      permissions: ['Produção', 'Estoque', 'Lotes', 'Rastreabilidade e perdas'],
      color: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      role: 'VENDEDOR',
      title: 'Vendedor',
      permissions: ['Clientes', 'Pedidos', 'Emissão de vendas e consulta de estoque'],
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Configurações Gerais do Sistema
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão simplificada: dados da empresa com upload de logo, atalhos rápidos de clientes, estoque, permissões e regras automáticas.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configurações salvas!
          </div>
        )}
      </div>

      {/* Categories Tabs as required */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory('empresa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'empresa'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>🏢 1. Empresa</span>
        </button>

        <button
          onClick={() => setActiveCategory('clientes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'clientes'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 2. Clientes</span>
        </button>

        <button
          onClick={() => setActiveCategory('estoque')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'estoque'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 3. Estoque</span>
        </button>

        <button
          onClick={() => setActiveCategory('usuarios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'usuarios'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>👤 4. Usuários e permissões</span>
        </button>

        <button
          onClick={() => setActiveCategory('regras')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'regras'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>⚡ 5. Regras automáticas</span>
        </button>

        <button
          onClick={() => setActiveCategory('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 ${
            activeCategory === 'backup'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>💾 6. Dados & Backup</span>
        </button>
      </div>

      {/* 🏢 1. Empresa com Upload de Logo */}
      {activeCategory === 'empresa' && (
        <form onSubmit={handleSaveEmpresa} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              🏢 Dados Cadastrais da Empresa
            </h3>
            <p className="text-xs text-slate-500">
              Informações e logotipo que aparecem no painel lateral, notas de pedidos e mensagens oficiais.
            </p>
          </div>

          {/* Campo de Upload da Logo da Empresa */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Logo da Empresa
                </label>
                <p className="text-[11px] text-slate-500">
                  Carregue a imagem da sua logo (PNG, JPG, SVG). Ela será exibida no menu lateral e nos comprovantes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoUrl ? 'Trocar Logo' : 'Carregar Imagem da Logo'}</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Banner de Salvo Automático da Logo */}
            {logoSaveSuccess && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-2xs animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{logoUrl ? 'Logo salva e sincronizada com sucesso! Já visível no menu superior e lateral.' : 'Logo removida com sucesso!'}</span>
              </div>
            )}

            {/* Pré-visualização da Logo */}
            {logoUrl ? (
              <div className="flex items-center gap-4 pt-1">
                <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs">
                  <img src={logoUrl} alt="Pré-visualização da Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-emerald-700 block">✓ Logo ativa no sistema</span>
                  <span className="text-[11px] text-slate-500">Exibida em alta resolução no menu superior, lateral e notas.</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span>Nenhuma logo carregada ainda. O sistema exibirá o ícone padrão 🍇</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da empresa (Razão Social)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Fantasia (Aparece no menu com a logo)
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone Oficial
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          {/* Dados Pix para cobrança */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Chave Pix Oficial para Cobrança Automática no WhatsApp
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Tipo da Chave
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                >
                  <option value="CNPJ">CNPJ</option>
                  <option value="TELEFONE">Telefone</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="ALEATORIA">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados da Empresa</span>
            </button>
          </div>
        </form>
      )}

      {/* 👥 2. Clientes: Lista simples com Nome, 🗑️ e ✏️ */}
      {activeCategory === 'clientes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                👥 Gestão de Clientes
              </h3>
              <p className="text-xs text-slate-500">
                Lista direta dos clientes cadastrados. Use a lixeira (🗑️) para cancelar o cadastro ou o lápis (✏️) para ajustar o limite de crédito.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Total: {customers.length} clientes
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum cliente cadastrado no momento.
              </div>
            ) : (
              customers.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Lápis: Redireciona para Clientes em Ajustar Limite de Crédito */}
                    <button
                      type="button"
                      onClick={() => handleEditCustomerCreditLimit(c)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Editar limite de crédito deste cliente"
                    >
                      <span className="text-base">✏️</span>
                    </button>

                    {/* Botão Lixeira: Pergunta se quer mesmo cancelar cadastro */}
                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(c)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Cancelar cadastro do cliente"
                    >
                      <span className="text-base">🗑️</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 📦 3. Estoque: Lista simples com Nome dos Produtos, 🗑️ e ✏️ */}
      {activeCategory === 'estoque' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                📦 Gestão de Estoque
              </h3>
              <p className="text-xs text-slate-500">
                Lista direta dos produtos. Use a lixeira (🗑️) para apagar o produto ou o lápis (✏️) para ajustar a quantidade e perdas no estoque.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              Total: {products.length} produtos
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {products.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum produto cadastrado no catálogo.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm">{p.name}</span>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Lápis: Redireciona para Estoque em Ajustar Quantidade / Perda */}
                    <button
                      type="button"
                      onClick={() => handleEditProductStockAdjust(p)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Ajustar quantidade e perdas deste produto no estoque"
                    >
                      <span className="text-base">✏️</span>
                    </button>

                    {/* Botão Lixeira: Pergunta se quer mesmo apagar produto do estoque */}
                    <button
                      type="button"
                      onClick={() => setProductToDelete(p)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Apagar produto do estoque"
                    >
                      <span className="text-base">🗑️</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 👤 4. Usuários e permissões */}
      {activeCategory === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              👤 4. Usuários e Permissões
            </h3>
            <p className="text-xs text-slate-500">
              Permite definir o que cada pessoa pode fazer dentro da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rolesMatrix.map((item) => (
              <div
                key={item.role}
                className={`p-5 rounded-2xl border ${
                  currentUserRole === item.role
                    ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                    : 'border-slate-200 bg-white'
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-lg border ${item.color}`}
                  >
                    {item.role}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">
                    Módulos e Ações Permitidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                      >
                        ✓ {perm}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {currentUserRole === item.role ? 'Perfil Ativo no Momento' : 'Alternar para este perfil'}
                  </span>
                  <button
                    onClick={() => setCurrentUserRole(item.role as UserRole)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      currentUserRole === item.role
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {currentUserRole === item.role ? 'Ativo' : 'Simular Perfil'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⚡ 5. Regras automáticas */}
      {activeCategory === 'regras' && (
        <form onSubmit={handleSaveEmpresa} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              ⚡ 5. Regras Automáticas & Políticas Comerciais
            </h3>
            <p className="text-xs text-slate-500">
              Permite que o sistema tome ações e gere alertas automaticamente para evitar prejuízos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Taxa Padrão da Maquininha de Cartão (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={defaultCardFee}
                onChange={(e) => setDefaultCardFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[11px] text-slate-500">
                Percentual repassado e somado ao valor pago pelo cliente em vendas no cartão.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Limite de Crédito Padrão para Novos Clientes (R$)
              </label>
              <input
                type="number"
                step="100"
                value={defaultCreditLimit}
                onChange={(e) => setDefaultCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[11px] text-slate-500">
                Novos clientes começam com limite de R$ 0,00 e você pode ajustar manualmente conforme necessário.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Dias de Antecedência para Alerta de Vencimento
              </label>
              <input
                type="number"
                value={alertDaysBeforeExpiry}
                onChange={(e) => setAlertDaysBeforeExpiry(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
              />
              <p className="text-[11px] text-slate-500">
                Lotes com validade menor que esse período são sinalizados como "Próximos do vencimento".
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Bloqueio Automático de Inadimplentes
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Impede novas vendas a prazo para clientes com faturas em atraso no sistema.
                </p>
              </div>
              <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-xs text-slate-800">
                <input
                  type="checkbox"
                  checked={blockDelinquent}
                  onChange={(e) => setBlockDelinquent(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ativar bloqueio automático</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Regras Automáticas</span>
            </button>
          </div>
        </form>
      )}

      {/* 💾 6. Dados & Backup */}
      {activeCategory === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800">
              💾 6. Gerenciamento de Dados e Inicialização
            </h3>
            <p className="text-xs text-slate-500">
              Permite alternar entre dados de demonstração (iguais ao projeto piloto) ou limpar o sistema para uso comercial real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Restaurar Demonstração do PDF
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Carrega o conjunto completo de dados pré-configurados: Lote ACA-07102026-01, clientes João, Pedro, Maria e saldo de R$ 12.480.
              </p>
              {isConfirmingReset ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-900 block">
                    Restaurar os dados de demonstração iniciais?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetAllData();
                        setIsConfirmingReset(false);
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 2000);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                    >
                      Sim, Restaurar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(true)}
                  className="px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs cursor-pointer"
                >
                  Restaurar Demonstração
                </button>
              )}
            </div>

            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <Trash2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">
                  Limpar Dados para Operação Real
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Zera vendas, clientes, contas e pedidos de teste para iniciar a operação comercial limpa da sua fábrica.
              </p>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs cursor-pointer"
              >
                Limpar Dados Operacionais
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Cancelamento de Cadastro de Cliente (🗑️) */}
      {customerToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setCustomerToDelete(null)}
          title="Confirmar Cancelamento de Cadastro"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Você quer mesmo cancelar o cadastro deste cliente?</span>
              </p>
              <p className="text-[11px] text-rose-700">
                Cliente selecionado: <strong>{customerToDelete.name}</strong>
              </p>
            </div>

            <p className="text-slate-600">
              Ao confirmar, o cadastro do cliente <strong>{customerToDelete.name}</strong> será excluído da base de clientes.
            </p>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Não, manter cliente
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Sim, cancelar cadastro
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Exclusão de Produto do Estoque (🗑️) */}
      {productToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setProductToDelete(null)}
          title="Confirmar Exclusão do Produto do Estoque"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Você quer mesmo apagar este produto do estoque?</span>
              </p>
              <p className="text-[11px] text-rose-700">
                Produto selecionado: <strong>{productToDelete.name}</strong>
              </p>
            </div>

            <p className="text-slate-600">
              Ao confirmar, o produto <strong>{productToDelete.name}</strong> e todos os seus lotes vinculados serão removidos do estoque.
            </p>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Não, manter produto
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Sim, apagar produto
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Limpeza de dados gerais */}
      {isClearModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsClearModalOpen(false)}
          title="Limpar Dados Operacionais para Início Real"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Deseja manter o catálogo de produtos e cadastros básicos ou zerar completamente?
            </p>

            <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={keepCatalogChoice}
                onChange={(e) => setKeepCatalogChoice(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span className="font-bold text-slate-800">
                Manter catálogo de produtos cadastrados (apenas zerar vendas, contas e lotes)
              </span>
            </label>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData({ keepProducts: keepCatalogChoice });
                  setIsClearModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Confirmar Limpeza
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
