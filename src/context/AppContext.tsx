import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  LotItem,
  Customer,
  Order,
  ReceivableItem,
  Transaction,
  ProductionRecord,
  SystemAlert,
  CompanySettings,
  UserRole,
  PaymentMethod,
  PaymentStatus,
  NoteItem,
  FlavorItem,
  ProductionLotItem,
  ProductionLabelSettings,
} from '../types';
import {
  initialCompanySettings,
  initialProducts,
  initialLots,
  initialCustomers,
  initialOrders,
  initialReceivables,
  initialTransactions,
  initialProductions,
  initialAlerts,
  initialNotes,
  initialFlavors,
  initialBaseIceCreamIngredients,
  initialBaseAcaiIngredients,
  initialProductionLots,
  initialProductionNotes,
  initialProductionLabelSettings,
} from '../data/initialData';

interface DashboardStats {
  monthlySales: number;
  estimatedProfit: number;
  totalProductsInStock: number;
  expiringSoonCount: number;
  totalReceivables: number;
  delinquentCount: number;
  monthlyProductions: number;
}

interface FinancialSummary {
  companyBalance: number;
  receivablesTotal: number;
  payablesTotal: number;
}

interface AppContextType {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isDemoMode: boolean;
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  products: Product[];
  lots: LotItem[];
  customers: Customer[];
  orders: Order[];
  receivables: ReceivableItem[];
  transactions: Transaction[];
  productions: ProductionRecord[];
  alerts: SystemAlert[];
  dashboardStats: DashboardStats;
  financialSummary: FinancialSummary;
  notes: NoteItem[];
  
  // Navigation / Deep Linking Targets
  targetClientForCreditLimitEdit: string | null;
  setTargetClientForCreditLimitEdit: (id: string | null) => void;
  targetLotForAdjust: string | null;
  setTargetLotForAdjust: (lotId: string | null) => void;

  // Actions
  createOrder: (orderData: {
    customerId: string;
    items: { productId: string; lotNumber: string; quantity: number; unitPrice: number; productCode?: string }[];
    paymentMethod: PaymentMethod;
    paymentStatus?: 'PAGO' | 'PENDENTE' | 'ATRASADO';
    darBaixaImediata?: boolean;
    dueDate?: string;
    notes?: string;
    discountAmount?: number;
    overrideCreditLimit?: boolean;
  }) => { success: boolean; message: string; order?: Order };
  
  darBaixaPedido: (orderId: string, amountPaid?: number) => void;
  
  createProduction: (prodData: {
    productId: string;
    quantityProduced: number;
    unitCost: number;
    losses: number;
    responsiblePerson: string;
    ingredients: { name: string; quantity: string; cost: number }[];
    productionDate: string;
    expiryDate: string;
    lotNumber?: string;
    notes?: string;
  }) => { success: boolean; lotNumber: string };
  
  receivePayment: (receivableId: string, amountPaid?: number) => void;
  payPayableTransaction: (txId: string, amountPaid: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'totalPurchased' | 'openBalance' | 'daysOverdue' | 'createdAt'>) => void;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (prod: Omit<Product, 'id'>) => void;
  deleteProduct: (id: string) => void;
  addLot: (lot: Omit<LotItem, 'id'>) => void;
  deleteLot: (id: string) => void;
  updateLotQuantity: (lotId: string, delta: number, reason?: string) => void;
  resolveAlert: (alertId: string) => void;
  dispatchRecallAlert: (lotNumber: string, message: string) => void;
  resetAllData: () => void;
  clearAllData: (options?: { keepProducts?: boolean }) => void;
  generateWhatsAppMessage: (receivable: ReceivableItem) => string;

  // Notes
  addNote: (content: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;

  // Dedicated Production Module (Sorvetes & Açaí)
  flavors: FlavorItem[];
  addFlavor: (flavor: Omit<FlavorItem, 'id'>) => FlavorItem;
  updateFlavor: (id: string, updated: Partial<FlavorItem>) => void;
  deleteFlavor: (id: string) => void;
  baseIceCreamIngredients: { name: string; quantity: string }[];
  setBaseIceCreamIngredients: React.Dispatch<React.SetStateAction<{ name: string; quantity: string }[]>>;
  baseAcaiIngredients: { name: string; quantity: string }[];
  setBaseAcaiIngredients: React.Dispatch<React.SetStateAction<{ name: string; quantity: string }[]>>;
  productionLots: ProductionLotItem[];
  createProductionLot: (lotData: Omit<ProductionLotItem, 'id' | 'createdAt'>) => { success: boolean; lot: ProductionLotItem };
  updateProductionLotQty: (lotId: string, delta: number, reason?: string) => void;
  productionNotes: { id: string; content: string; createdAt: string }[];
  addProductionNote: (content: string) => void;
  updateProductionNote: (id: string, content: string) => void;
  deleteProductionNote: (id: string) => void;
  productionLabelSettings: ProductionLabelSettings;
  updateProductionLabelSettings: (newSettings: Partial<ProductionLabelSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'gestao_pro_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ADMINISTRADOR');

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_is_demo`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Core collections
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [lots, setLots] = useState<LotItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_lots`);
    return saved ? JSON.parse(saved) : initialLots;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [receivables, setReceivables] = useState<ReceivableItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_receivables`);
    return saved ? JSON.parse(saved) : initialReceivables;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [productions, setProductions] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_productions`);
    return saved ? JSON.parse(saved) : initialProductions;
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_alerts`);
    return saved ? JSON.parse(saved) : initialAlerts;
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notes`);
    return saved ? JSON.parse(saved) : initialNotes;
  });

  // Dedicated Production Module States (Flavors, Base Ingredients, Production Lots, Production Notes, Production Label Settings)
  const [flavors, setFlavors] = useState<FlavorItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_flavors`);
    return saved ? JSON.parse(saved) : initialFlavors;
  });

  const [baseIceCreamIngredients, setBaseIceCreamIngredients] = useState<{ name: string; quantity: string }[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_base_ice_cream`);
    return saved ? JSON.parse(saved) : initialBaseIceCreamIngredients;
  });

  const [baseAcaiIngredients, setBaseAcaiIngredients] = useState<{ name: string; quantity: string }[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_base_acai`);
    return saved ? JSON.parse(saved) : initialBaseAcaiIngredients;
  });

  const [productionLots, setProductionLots] = useState<ProductionLotItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_production_lots`);
    return saved ? JSON.parse(saved) : initialProductionLots;
  });

  const [productionNotes, setProductionNotes] = useState<{ id: string; content: string; createdAt: string }[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_production_notes`);
    return saved ? JSON.parse(saved) : initialProductionNotes;
  });

  const [productionLabelSettings, setProductionLabelSettings] = useState<ProductionLabelSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_production_label_settings`);
    return saved ? JSON.parse(saved) : initialProductionLabelSettings;
  });

  // Deep linking targets for quick actions
  const [targetClientForCreditLimitEdit, setTargetClientForCreditLimitEdit] = useState<string | null>(null);
  const [targetLotForAdjust, setTargetLotForAdjust] = useState<string | null>(null);

  // Safe LocalStorage persistence helper to prevent QuotaExceededError or crashes
  const safeLocalStorageSet = (key: string, val: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn(`[LocalStorage] Falha ao persistir chave ${key}:`, err);
    }
  };

  // Persist to local storage
  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_is_demo`, isDemoMode);
  }, [isDemoMode]);
  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_settings`, settings);
  }, [settings]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_products`, products);
  }, [products]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_lots`, lots);
  }, [lots]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_customers`, customers);
  }, [customers]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_orders`, orders);
  }, [orders]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_receivables`, receivables);
  }, [receivables]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_transactions`, transactions);
  }, [transactions]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_productions`, productions);
  }, [productions]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_alerts`, alerts);
  }, [alerts]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_notes`, notes);
  }, [notes]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_flavors`, flavors);
  }, [flavors]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_base_ice_cream`, baseIceCreamIngredients);
  }, [baseIceCreamIngredients]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_base_acai`, baseAcaiIngredients);
  }, [baseAcaiIngredients]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_production_lots`, productionLots);
  }, [productionLots]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_production_notes`, productionNotes);
  }, [productionNotes]);

  useEffect(() => {
    safeLocalStorageSet(`${STORAGE_KEY}_production_label_settings`, productionLabelSettings);
  }, [productionLabelSettings]);

  // Sincronização automática e contínua de status de inadimplência, vencimentos de contas a receber e clientes
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [tY, tM, tD] = todayStr.split('-').map(Number);
    const todayUtc = Date.UTC(tY, tM - 1, tD);

    // 1. Sincronizar Recebíveis com base na data de vencimento
    setReceivables((prevRecs) => {
      let changed = false;
      const updated = prevRecs.map((r) => {
        if (r.status === 'PAGO' || r.amount <= 0) {
          if (r.daysOverdue !== 0) {
            changed = true;
            return { ...r, daysOverdue: 0 };
          }
          return r;
        }
        if (!r.dueDate) return r;
        const [rY, rM, rD] = r.dueDate.split('-').map(Number);
        const rDueUtc = Date.UTC(rY, rM - 1, rD);
        const diffDays = Math.round((todayUtc - rDueUtc) / (1000 * 60 * 60 * 24));
        const targetStatus: 'ATRASADO' | 'HOJE' | 'PENDENTE' =
          diffDays > 0 ? 'ATRASADO' : diffDays === 0 ? 'HOJE' : 'PENDENTE';
        const targetDays = diffDays > 0 ? diffDays : 0;

        if (r.status !== targetStatus || r.daysOverdue !== targetDays) {
          changed = true;
          return { ...r, status: targetStatus, daysOverdue: targetDays };
        }
        return r;
      });
      return changed ? updated : prevRecs;
    });

    // 2. Sincronizar Clientes: calcular daysOverdue com base em títulos em aberto
    setCustomers((prevCustomers) => {
      let changed = false;
      const updated = prevCustomers.map((c) => {
        const openRecs = receivables.filter(
          (r) =>
            (r.customerId === c.id || r.customerName.toLowerCase() === c.name.toLowerCase()) &&
            r.status !== 'PAGO' &&
            r.amount > 0
        );
        let maxDaysLate = 0;
        openRecs.forEach((r) => {
          if (r.dueDate) {
            const [rY, rM, rD] = r.dueDate.split('-').map(Number);
            const rDueUtc = Date.UTC(rY, rM - 1, rD);
            const diffDays = Math.round((todayUtc - rDueUtc) / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysLate) maxDaysLate = diffDays;
          } else if (r.daysOverdue > maxDaysLate) {
            maxDaysLate = r.daysOverdue;
          }
        });
        if (c.daysOverdue !== maxDaysLate) {
          changed = true;
          return { ...c, daysOverdue: maxDaysLate };
        }
        return c;
      });
      return changed ? updated : prevCustomers;
    });

    // 3. Sincronizar Pedidos a prazo com data de vencimento expirada
    setOrders((prevOrders) => {
      let changed = false;
      const updated = prevOrders.map((o) => {
        if (o.paymentStatus === 'PAGO' || (o.remainingAmount !== undefined && o.remainingAmount <= 0)) {
          return o;
        }
        if (o.paymentMethod === 'A_PRAZO' && o.dueDate) {
          const [oY, oM, oD] = o.dueDate.split('-').map(Number);
          const oDueUtc = Date.UTC(oY, oM - 1, oD);
          const diffDays = Math.round((todayUtc - oDueUtc) / (1000 * 60 * 60 * 24));
          const targetStatus: PaymentStatus = diffDays > 0 ? 'ATRASADO' : 'PENDENTE';
          if (o.paymentStatus !== targetStatus) {
            changed = true;
            return { ...o, paymentStatus: targetStatus };
          }
        }
        return o;
      });
      return changed ? updated : prevOrders;
    });

    // 4. Sincronizar Alertas urgentes de inadimplência
    const overdueRecs = receivables.filter((r) => {
      if (r.status === 'PAGO' || r.amount <= 0 || !r.dueDate) return false;
      const [rY, rM, rD] = r.dueDate.split('-').map(Number);
      return Date.UTC(rY, rM - 1, rD) < todayUtc;
    });

    if (overdueRecs.length > 0) {
      setAlerts((prevAlerts) => {
        let updated = [...prevAlerts];
        let hasChanges = false;
        overdueRecs.forEach((item) => {
          const alertId = `alt-overdue-${item.id}`;
          const existing = updated.find((a) => a.id === alertId);
          const [rY, rM, rD] = item.dueDate.split('-').map(Number);
          const daysLate = Math.max(1, Math.round((todayUtc - Date.UTC(rY, rM - 1, rD)) / (1000 * 60 * 60 * 24)));

          if (!existing) {
            hasChanges = true;
            updated.unshift({
              id: alertId,
              title: `Cliente inadimplente: ${item.customerName}`,
              description: `A fatura de R$ ${item.amount.toFixed(2)} está com vencimento expirado há ${daysLate} dia(s).`,
              urgency: 'URGENTE',
              category: 'FINANCEIRO',
              date: todayStr,
              actionText: 'Cobrar no WhatsApp',
              actionTarget: 'receber',
              resolved: false,
            });
          } else if (existing.resolved) {
            existing.resolved = false;
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prevAlerts;
      });
    }
  }, [receivables.length, orders.length]);

  // Compute stats according to user specifications:
  // 1. "Produto em estoque" deve contar produtos distintos cadastrados com estoque ativo (> 0), e não a soma das unidades
  const uniqueProductsInStock = new Set(
    lots.filter((lot) => lot.quantity > 0).map((lot) => lot.productId)
  ).size;
  const totalProductsInStock = uniqueProductsInStock;
  
  // 2. "Produtos próximos do vencimento" deve verificar a data de validade real (alertDaysBeforeExpiry), não o estoque baixo
  const nowMs = new Date().getTime();
  const alertDaysMs = (settings.alertDaysBeforeExpiry || 30) * 24 * 60 * 60 * 1000;
  const expiringSoonCount = lots.filter((lot) => {
    if (lot.quantity <= 0) return false;
    if (!lot.expiryDate) return false;
    const expMs = new Date(lot.expiryDate).getTime();
    const diffMs = expMs - nowMs;
    return diffMs <= alertDaysMs; // Vence dentro do prazo de alerta ou já venceu
  }).length;

  const totalReceivables = receivables
    .filter((r) => r.status !== 'PAGO')
    .reduce((acc, r) => acc + r.amount, 0);

  const delinquentCount = customers.filter((c) => c.daysOverdue > 0 && c.openBalance > 0).length;

  const isDemoBaseline = isDemoMode && orders.length >= 5 && customers.length >= 6;

  const monthlySales = isDemoBaseline
    ? 18450 + orders.slice(5).reduce((acc, o) => acc + o.totalAmount, 0)
    : orders.reduce((acc, o) => acc + o.totalAmount, 0);

  const estimatedProfit = isDemoBaseline
    ? 6820 + orders.slice(5).reduce((acc, o) => acc + (o.totalAmount * 0.38), 0)
    : orders.reduce((acc, o) => acc + (o.netAmount * 0.35), 0);

  const monthlyProductions = isDemoBaseline
    ? 26 + (productions.length - initialProductions.length)
    : productions.length;

  const dashboardStats: DashboardStats = {
    monthlySales,
    estimatedProfit,
    totalProductsInStock,
    expiringSoonCount,
    totalReceivables: isDemoBaseline ? (totalReceivables || 3250) : totalReceivables,
    delinquentCount,
    monthlyProductions,
  };

  // Financial stats
  const totalEntradas = transactions
    .filter((t) => t.type === 'ENTRADA')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalSaidas = transactions
    .filter((t) => t.type === 'SAIDA')
    .reduce((acc, t) => acc + t.amount, 0);

  const txDelta = transactions.slice(initialTransactions.length).reduce((acc, tx) => {
    return tx.type === 'ENTRADA' ? acc + tx.amount : tx.type === 'SAIDA' ? acc - tx.amount : acc;
  }, 0);

  const companyBalance = isDemoBaseline
    ? 12480 + txDelta
    : (totalEntradas - totalSaidas);

  // Contas a pagar reais dos lançamentos com type === 'A_PAGAR' e status pendente
  const realPayables = transactions
    .filter((t) => t.type === 'A_PAGAR' && t.status !== 'PAGO')
    .reduce((acc, t) => acc + (t.remainingAmount !== undefined ? t.remainingAmount : t.amount), 0);

  const payablesTotal = realPayables;
  const financialReceivables = totalReceivables;

  const financialSummary: FinancialSummary = {
    companyBalance,
    receivablesTotal: financialReceivables,
    payablesTotal,
  };

  // Create Order with automatic updates to Stock, Receivables, Finance, and Customer Limits
  const createOrder = (orderData: {
    customerId: string;
    items: { productId: string; lotNumber: string; quantity: number; unitPrice: number; productCode?: string }[];
    paymentMethod: PaymentMethod;
    paymentStatus?: 'PAGO' | 'PENDENTE' | 'ATRASADO';
    darBaixaImediata?: boolean;
    dueDate?: string;
    notes?: string;
    discountAmount?: number;
    overrideCreditLimit?: boolean;
  }) => {
    const customer = customers.find((c) => c.id === orderData.customerId);
    if (!customer) {
      return { success: false, message: 'Cliente não encontrado.' };
    }

    const subtotal = orderData.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const discountAmount = Math.max(0, orderData.discountAmount || 0);
    const baseAfterDiscount = Math.max(0, subtotal - discountAmount);

    // Na taxa da maquininha a taxa é responsabilidade do cliente, portanto é SOMADA ao valor pago pelo cliente
    let cardFeeAmount = 0;
    let totalAmount = baseAfterDiscount;
    if (orderData.paymentMethod === 'CARTAO') {
      cardFeeAmount = +(baseAfterDiscount * (settings.defaultCardFee / 100)).toFixed(2);
      totalAmount = +(baseAfterDiscount + cardFeeAmount).toFixed(2);
    }
    const netAmount = baseAfterDiscount; // Valor líquido que a empresa recebe

    // Credit limit validation for A PRAZO
    if (orderData.paymentMethod === 'A_PRAZO') {
      const isDelinquent = customer.daysOverdue > 0 && customer.openBalance > 0;
      if (settings.blockDelinquentCustomers && isDelinquent && !orderData.overrideCreditLimit) {
        return {
          success: false,
          message: `Cliente possui R$ ${customer.openBalance.toFixed(2)} em aberto com dias de atraso. Pagamento a prazo bloqueado!`,
        };
      }

      const availableCredit = Math.max(0, customer.creditLimit - customer.openBalance);
      if (totalAmount > availableCredit && !orderData.overrideCreditLimit) {
        return {
          success: false,
          message: `⚠️ Cliente possui R$ ${customer.openBalance.toFixed(2)} em aberto. Novo pedido (R$ ${totalAmount.toFixed(2)}) ultrapassa o limite de crédito disponível (R$ ${availableCredit.toFixed(2)}).`,
        };
      }
    }

    // Check stock availability
    const requiredPerLot: Record<string, number> = {};
    for (const item of orderData.items) {
      requiredPerLot[item.lotNumber] = (requiredPerLot[item.lotNumber] || 0) + item.quantity;
    }
    for (const [lotNum, reqQty] of Object.entries(requiredPerLot)) {
      const lot = lots.find((l) => l.lotNumber === lotNum);
      if (!lot) {
        return { success: false, message: `Lote ${lotNum} não encontrado.` };
      }
      if (lot.quantity < reqQty) {
        return {
          success: false,
          message: `Estoque insuficiente no lote ${lotNum}! Disponível: ${lot.quantity}, Solicitado: ${reqQty}.`,
        };
      }
    }

    const orderNumber = `PED-${1049 + orders.length - initialOrders.length}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const createdAt = `${dateStr} ${timeStr}`;

    // Determine if payment is already paid (dar baixa imediata) or pending
    let isPaid = false;
    if (orderData.paymentMethod === 'A_PRAZO') {
      isPaid = false;
    } else if (orderData.darBaixaImediata !== undefined) {
      isPaid = orderData.darBaixaImediata;
    } else if (orderData.paymentStatus !== undefined) {
      isPaid = orderData.paymentStatus === 'PAGO';
    } else {
      // By default for Pix/Dinheiro/Cartão, if unspecified, true
      isPaid = true;
    }

    // Check if due date is in the past / overdue (e.g. A_PRAZO com data anterior a hoje)
    const dueDateStr = (orderData.paymentMethod === 'A_PRAZO' && orderData.dueDate) ? orderData.dueDate : dateStr;
    const [tY, tM, tD] = dateStr.split('-').map(Number);
    const [dY, dM, dD] = dueDateStr.split('-').map(Number);
    const todayUtc = Date.UTC(tY, tM - 1, tD);
    const dueUtc = Date.UTC(dY, dM - 1, dD);
    const diffDays = Math.round((todayUtc - dueUtc) / (1000 * 60 * 60 * 24));

    const isOverdue = !isPaid && diffDays > 0;
    const isToday = !isPaid && diffDays === 0;
    const daysOverdue = isOverdue ? diffDays : 0;

    const paymentStatus: PaymentStatus = isPaid ? 'PAGO' : isOverdue ? 'ATRASADO' : 'PENDENTE';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: orderData.items.map((i) => {
        const prod = products.find((p) => p.id === i.productId);
        return {
          ...i,
          productCode: i.productCode || prod?.code,
          productName: prod?.name || 'Produto',
          total: i.quantity * i.unitPrice,
        };
      }),
      subtotal,
      discountAmount,
      totalAmount,
      netAmount,
      cardFeePercentage: orderData.paymentMethod === 'CARTAO' ? settings.defaultCardFee : undefined,
      cardFeeAmount: orderData.paymentMethod === 'CARTAO' ? cardFeeAmount : undefined,
      paymentMethod: orderData.paymentMethod,
      paymentStatus,
      darBaixaImediata: isPaid,
      dueDate: dueDateStr,
      paidAt: isPaid ? createdAt : undefined,
      createdAt,
      notes: orderData.notes,
      paidAmount: isPaid ? totalAmount : 0,
      remainingAmount: isPaid ? 0 : totalAmount,
    };

    // 1. Deduct Stock
    setLots((prevLots) =>
      prevLots.map((lot) => {
        const totalDeducted = orderData.items
          .filter((i) => i.lotNumber === lot.lotNumber)
          .reduce((sum, i) => sum + i.quantity, 0);
        if (totalDeducted > 0) {
          const newQty = Math.max(0, lot.quantity - totalDeducted);
          return {
            ...lot,
            quantity: newQty,
            status: newQty === 0 ? 'ESGOTADO' : lot.status,
          };
        }
        return lot;
      })
    );

    // 2. Update Customer Record
    setCustomers((prevCustomers) =>
      prevCustomers.map((c) => {
        if (c.id === customer.id) {
          const newOpenBalance = !isPaid ? c.openBalance + totalAmount : c.openBalance;
          const newDaysOverdue = (!isPaid && daysOverdue > 0)
            ? Math.max(c.daysOverdue || 0, daysOverdue)
            : c.daysOverdue;
          return {
            ...c,
            totalPurchased: c.totalPurchased + totalAmount,
            openBalance: newOpenBalance,
            daysOverdue: newDaysOverdue,
          };
        }
        return c;
      })
    );

    // 3. Update Financial or Accounts Receivable
    if (isPaid) {
      // Dar baixa imediata: insere transação no caixa
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        date: dateStr,
        description: `Venda Pedido ${orderNumber} - ${customer.name}`,
        type: 'ENTRADA',
        amount: totalAmount,
        category: 'Vendas',
        relatedOrderId: newOrder.id,
        paymentMethod: orderData.paymentMethod,
      };
      setTransactions((prev) => [newTx, ...prev]);
    } else {
      // Registrar em Contas a Receber
      const methodLabel =
        orderData.paymentMethod === 'A_PRAZO'
          ? `Venda a Prazo (Vence: ${dueDateStr})`
          : orderData.paymentMethod === 'PIX'
          ? 'Pix (Aguardando conferência)'
          : orderData.paymentMethod === 'CARTAO'
          ? 'Cartão (Aguardando compensação)'
          : 'Dinheiro (Aguardando entrega/recebimento)';

      const recStatus: 'ATRASADO' | 'HOJE' | 'PENDENTE' =
        isOverdue ? 'ATRASADO' : isToday ? 'HOJE' : 'PENDENTE';

      const newRec: ReceivableItem = {
        id: `rec-${Date.now()}`,
        orderId: newOrder.id,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        amount: totalAmount,
        originalAmount: totalAmount,
        paidAmount: 0,
        dueDate: dueDateStr,
        status: recStatus,
        daysOverdue: daysOverdue,
        description: `Pedido ${orderNumber} - ${methodLabel}`,
      };
      setReceivables((prev) => [newRec, ...prev]);
    }

    // 4. Record the order
    setOrders((prev) => [newOrder, ...prev]);

    // 5. Add System Alerts
    const alertsToAdd: SystemAlert[] = [];
    if (isOverdue) {
      alertsToAdd.push({
        id: `alt-overdue-${newOrder.id}`,
        title: `Cliente inadimplente: ${customer.name}`,
        description: `O pedido ${orderNumber} a prazo foi emitido com vencimento em ${dueDateStr.split('-').reverse().join('/')} e já está vencido há ${daysOverdue} dia(s). Saldo: R$ ${totalAmount.toFixed(2)}.`,
        urgency: 'URGENTE',
        category: 'FINANCEIRO',
        date: dateStr,
        actionText: 'Cobrar no WhatsApp',
        actionTarget: 'receber',
        resolved: false,
      });
    }

    alertsToAdd.push({
      id: `alt-${Date.now()}`,
      title: isOverdue ? `Novo pedido em atraso (${orderNumber})` : 'Novo pedido registrado',
      description: `Pedido ${orderNumber} para ${customer.name} no valor de R$ ${totalAmount.toFixed(2)} (${orderData.paymentMethod}${isPaid ? ' - Baixado' : isOverdue ? ' - ATRASADO' : ' - Pendente'}).`,
      urgency: isOverdue ? 'ATENCAO' : 'INFORMATIVO',
      category: isOverdue ? 'FINANCEIRO' : 'GERAL',
      date: dateStr,
      actionText: isOverdue ? 'Cobrar no WhatsApp' : 'Ver Pedido',
      actionTarget: isOverdue ? 'receber' : 'pedidos',
      resolved: false,
    });

    setAlerts((prev) => [...alertsToAdd, ...prev]);

    const returnMsg = isOverdue
      ? `Pedido ${orderNumber} criado! ⚠️ Atenção: Vencimento anterior a hoje (${daysOverdue} dias de atraso). Marcado como ATRASADO e cliente registrado como inadimplente.`
      : `Pedido ${orderNumber} criado com sucesso!`;

    return { success: true, message: returnMsg, order: newOrder };
  };

  // Dar Baixa manual em pedido pendente (com suporte a valor pago total ou parcial)
  const darBaixaPedido = (orderId: string, amountPaid?: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.paymentStatus === 'PAGO') return;

    const currentRemaining = order.remainingAmount !== undefined ? order.remainingAmount : (order.totalAmount - (order.paidAmount || 0));
    const actualAmount = amountPaid !== undefined ? Number(amountPaid) : currentRemaining;
    if (actualAmount <= 0) return;

    const newPaidSoFar = (order.paidAmount || 0) + actualAmount;
    const newRemaining = Math.max(0, order.totalAmount - newPaidSoFar);
    const isFullPayment = newRemaining <= 0;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const paidAt = `${dateStr} ${timeStr}`;

    // 1. Mark order as PAGO or update partial note without modifying totalAmount!
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          if (isFullPayment) {
            return {
              ...o,
              paidAmount: o.totalAmount,
              remainingAmount: 0,
              paymentStatus: 'PAGO',
              paidAt,
              darBaixaImediata: true,
            };
          } else {
            const cleanNotes = (o.notes || '').replace(/\s*\[Pago parcial:[^\]]*\]/g, '').trim();
            return {
              ...o,
              paidAmount: newPaidSoFar,
              remainingAmount: newRemaining,
              paymentStatus: 'PENDENTE',
              notes: `${cleanNotes} [Pago parcial: R$ ${newPaidSoFar.toFixed(2)} | Restante: R$ ${newRemaining.toFixed(2)}]`.trim(),
            };
          }
        }
        return o;
      })
    );

    // 2. Add financial transaction to Cash
    const newTx: Transaction = {
      id: `tx-baixa-${Date.now()}`,
      date: dateStr,
      description: `Baixa ${isFullPayment ? 'Total' : 'Parcial'} Pedido ${order.orderNumber} - ${order.customerName} (${order.paymentMethod})`,
      type: 'ENTRADA',
      amount: actualAmount,
      category: 'Vendas',
      relatedOrderId: order.id,
      paymentMethod: order.paymentMethod,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 3. Mark corresponding receivable as PAGO or update remaining
    setReceivables((prev) =>
      prev.map((r) => {
        if (r.orderId === order.id || (r.customerId === order.customerId && r.status !== 'PAGO')) {
          if (isFullPayment || actualAmount >= r.amount) {
            return {
              ...r,
              status: 'PAGO',
              amount: 0,
              paidAmount: (r.paidAmount || 0) + actualAmount,
              paidAt,
            };
          } else {
            return {
              ...r,
              amount: Math.max(0, r.amount - actualAmount),
              paidAmount: (r.paidAmount || 0) + actualAmount,
              status: 'PENDENTE',
            };
          }
        }
        return r;
      })
    );

    // 4. Deduct customer open balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === order.customerId && c.openBalance > 0) {
          const newOpen = Math.max(0, c.openBalance - actualAmount);
          return {
            ...c,
            openBalance: newOpen,
            daysOverdue: newOpen === 0 ? 0 : c.daysOverdue,
          };
        }
        return c;
      })
    );

    // 5. System Alert & resolve overdue alert if full payment
    const newAlert: SystemAlert = {
      id: `alt-baixa-${Date.now()}`,
      title: isFullPayment ? 'Baixa de pagamento confirmada' : 'Baixa parcial de pagamento',
      description: `Pagamento do Pedido ${order.orderNumber} (${order.customerName}) baixado no valor de R$ ${actualAmount.toFixed(2)}.`,
      urgency: 'INFORMATIVO',
      category: 'FINANCEIRO',
      date: dateStr,
      resolved: false,
    };

    setAlerts((prev) => {
      let list = [newAlert, ...prev];
      if (isFullPayment) {
        list = list.map((a) => {
          if (a.id.includes(order.id) || a.title.includes(order.customerName)) {
            return { ...a, resolved: true };
          }
          return a;
        });
      }
      return list;
    });
  };

  // Create Production batch (as specified in page 11)
  const createProduction = (prodData: {
    productId: string;
    quantityProduced: number;
    unitCost: number;
    losses: number;
    responsiblePerson: string;
    ingredients: { name: string; quantity: string; cost: number }[];
    productionDate: string;
    expiryDate: string;
    lotNumber?: string;
    notes?: string;
  }) => {
    const product = products.find((p) => p.id === prodData.productId);
    const prodName = product ? product.name : 'Açaí';

    // Auto-generate lot code if not provided (e.g., ACA-07102026-02)
    const dateClean = prodData.productionDate.replace(/-/g, '');
    const seq = String(productions.length + 1).padStart(2, '0');
    const autoLot = prodData.lotNumber || `ACA-${dateClean}-${seq}`;

    const totalIngredientsCost = prodData.ingredients.reduce((acc, ing) => acc + ing.cost, 0);
    const calculatedUnitCost =
      prodData.quantityProduced > 0
        ? +(totalIngredientsCost / prodData.quantityProduced).toFixed(2)
        : prodData.unitCost || 42.0;

    const newProd: ProductionRecord = {
      id: `prod-${Date.now()}`,
      lotNumber: autoLot,
      productId: prodData.productId,
      productName: prodName,
      quantityProduced: prodData.quantityProduced,
      unitCost: calculatedUnitCost || prodData.unitCost,
      totalCost: totalIngredientsCost || calculatedUnitCost * prodData.quantityProduced,
      losses: prodData.losses,
      responsiblePerson: prodData.responsiblePerson,
      ingredients: prodData.ingredients,
      productionDate: prodData.productionDate,
      expiryDate: prodData.expiryDate,
      notes: prodData.notes,
    };

    setProductions((prev) => [newProd, ...prev]);

    // Automatically add/update batch in stock (Estoque)
    const newLot: LotItem = {
      id: `lot-${Date.now()}`,
      lotNumber: autoLot,
      productId: prodData.productId,
      productName: prodName,
      quantity: prodData.quantityProduced - prodData.losses,
      initialQuantity: prodData.quantityProduced,
      manufacturingDate: prodData.productionDate,
      expiryDate: prodData.expiryDate,
      unitCost: calculatedUnitCost || prodData.unitCost,
      unitPrice: 75.0, // default selling price for standard product
      status: 'EM_ESTOQUE',
      observations: `Produção batelada responsável: ${prodData.responsiblePerson}`,
    };

    setLots((prev) => [newLot, ...prev]);

    // Financial transaction for production inputs
    if (totalIngredientsCost > 0) {
      const newTx: Transaction = {
        id: `tx-prod-${Date.now()}`,
        date: prodData.productionDate,
        description: `Custos de produção Lote ${autoLot} (${prodName})`,
        type: 'SAIDA',
        amount: totalIngredientsCost,
        category: 'Insumos',
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    // Informative alert
    const newAlert: SystemAlert = {
      id: `alt-prod-${Date.now()}`,
      title: 'Produção concluída com sucesso',
      description: `Lote ${autoLot} com ${newLot.quantity} unidades de ${prodName} adicionadas ao estoque.`,
      urgency: 'INFORMATIVO',
      category: 'PRODUCAO',
      date: prodData.productionDate,
      actionText: 'Conferir Estoque',
      actionTarget: 'estoque',
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);

    return { success: true, lotNumber: autoLot };
  };

  // Receive payment from accounts receivable (Page 6)
  const receivePayment = (receivableId: string, amountPaid?: number) => {
    const item = receivables.find((r) => r.id === receivableId);
    if (!item) return;

    const today = new Date().toISOString().split('T')[0];
    const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const paidAt = `${today} ${timeStr}`;

    const actualAmount = amountPaid !== undefined ? Number(amountPaid) : item.amount;
    if (actualAmount <= 0) return;

    const isFullPayment = actualAmount >= item.amount;

    // 1. Update accounts receivable (Recebíveis)
    setReceivables((prev) =>
      prev.map((r) => {
        if (r.id === receivableId) {
          if (isFullPayment) {
            return {
              ...r,
              status: 'PAGO',
              amount: 0,
              paidAmount: (r.paidAmount || 0) + actualAmount,
              paidAt,
            };
          } else {
            return {
              ...r,
              amount: Math.max(0, r.amount - actualAmount),
              paidAmount: (r.paidAmount || 0) + actualAmount,
              status: 'PENDENTE',
            };
          }
        }
        return r;
      })
    );

    // 2. Synchronize with Pedidos & Vendas without mutating totalAmount!
    if (item.orderId) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === item.orderId) {
            const newPaidSoFar = (o.paidAmount || 0) + actualAmount;
            const newRemaining = Math.max(0, o.totalAmount - newPaidSoFar);
            const isOrderFullyPaid = isFullPayment || newRemaining <= 0;
            if (isOrderFullyPaid) {
              return {
                ...o,
                paidAmount: o.totalAmount,
                remainingAmount: 0,
                paymentStatus: 'PAGO',
                paidAt,
                darBaixaImediata: true,
              };
            } else {
              const cleanNotes = (o.notes || '').replace(/\s*\[Pago parcial:[^\]]*\]/g, '').trim();
              return {
                ...o,
                paidAmount: newPaidSoFar,
                remainingAmount: newRemaining,
                paymentStatus: 'PENDENTE',
                notes: `${cleanNotes} [Pago parcial: R$ ${newPaidSoFar.toFixed(2)} | Restante: R$ ${newRemaining.toFixed(2)}]`.trim(),
              };
            }
          }
          return o;
        })
      );
    } else {
      // If receivable is by customer name or description, try to match open orders
      setOrders((prev) =>
        prev.map((o) => {
          if (o.customerId === item.customerId && o.paymentStatus !== 'PAGO' && isFullPayment) {
            return {
              ...o,
              paidAmount: o.totalAmount,
              remainingAmount: 0,
              paymentStatus: 'PAGO',
              paidAt,
              darBaixaImediata: true,
            };
          }
          return o;
        })
      );
    }

    // 3. Synchronize with Ficha de Clientes: reduce customer open balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === item.customerId) {
          const newOpen = Math.max(0, c.openBalance - actualAmount);
          return {
            ...c,
            openBalance: newOpen,
            daysOverdue: newOpen === 0 ? 0 : c.daysOverdue,
          };
        }
        return c;
      })
    );

    // 4. Add financial entry to company cash (+ Caixa)
    const newTx: Transaction = {
      id: `tx-rec-${Date.now()}`,
      date: today,
      description: `Recebimento Cobrança: ${item.customerName} (${item.description}) [${isFullPayment ? 'Total' : 'Parcial'}]`,
      type: 'ENTRADA',
      amount: actualAmount,
      category: 'Vendas',
      paymentMethod: 'PIX',
    };
    setTransactions((prev) => [newTx, ...prev]);

    // 5. System Alert & resolve overdue alert if full payment
    const newAlert: SystemAlert = {
      id: `alt-rec-${Date.now()}`,
      title: isFullPayment ? 'Pagamento integral recebido' : 'Pagamento parcial recebido',
      description: `Recebido R$ ${actualAmount.toFixed(2)} de ${item.customerName}. Saldo e limite atualizados.`,
      urgency: 'INFORMATIVO',
      category: 'FINANCEIRO',
      date: today,
      resolved: true,
    };

    setAlerts((prev) => {
      let list = [newAlert, ...prev];
      if (isFullPayment) {
        list = list.map((a) => {
          if (a.id === `alt-overdue-${item.id}` || (item.orderId && a.id.includes(item.orderId))) {
            return { ...a, resolved: true };
          }
          return a;
        });
      }
      return list;
    });
  };

  // Baixa / Pagamento de conta a pagar (A_PAGAR)
  const payPayableTransaction = (txId: string, amountPaid: number) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx || tx.type !== 'A_PAGAR' || tx.status === 'PAGO') return;

    const curRemaining = tx.remainingAmount !== undefined ? tx.remainingAmount : tx.amount;
    const paidVal = Math.min(curRemaining, Math.max(0, Number(amountPaid)));
    if (paidVal <= 0) return;

    const isFull = paidVal >= curRemaining;
    const today = new Date().toISOString().split('T')[0];
    const newRemaining = Math.max(0, curRemaining - paidVal);

    // Update the A_PAGAR record
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === txId) {
          return {
            ...t,
            remainingAmount: newRemaining,
            paidAmount: (t.paidAmount || 0) + paidVal,
            status: isFull ? 'PAGO' : 'PENDENTE',
            paidAt: isFull ? today : undefined,
          };
        }
        return t;
      })
    );

    // Record an outgoing entry (SAIDA) for the paid amount from company cash
    const expenseTx: Transaction = {
      id: `tx-saida-${Date.now()}`,
      date: today,
      description: `Pagamento de conta: ${tx.description} (${isFull ? 'Integral' : 'Parcial'})`,
      type: 'SAIDA',
      amount: paidVal,
      category: tx.category,
    };
    setTransactions((prev) => [expenseTx, ...prev]);

    // System Alert
    const newAlert: SystemAlert = {
      id: `alt-pay-${Date.now()}`,
      title: isFull ? 'Conta paga com sucesso' : 'Pagamento parcial de conta realizado',
      description: `Pagamento de R$ ${paidVal.toFixed(2)} realizado para "${tx.description}".`,
      urgency: 'INFORMATIVO',
      category: 'FINANCEIRO',
      date: today,
      resolved: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const isAPagar = tx.type === 'A_PAGAR';
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      status: isAPagar ? 'PENDENTE' : undefined,
      remainingAmount: isAPagar ? tx.amount : undefined,
      paidAmount: isAPagar ? 0 : undefined,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'totalPurchased' | 'openBalance' | 'daysOverdue' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
      totalPurchased: 0,
      openBalance: 0,
      daysOverdue: 0,
      creditLimit: cust.creditLimit !== undefined ? cust.creditLimit : 0, // Clientes novos começam com limite 0
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);

    const newAlert: SystemAlert = {
      id: `alt-cust-${Date.now()}`,
      title: 'Novo cliente cadastrado',
      description: `Cliente ${newCust.name} cadastrado com limite inicial de R$ ${newCust.creditLimit.toFixed(2)}.`,
      urgency: 'INFORMATIVO',
      category: 'CLIENTES',
      date: newCust.createdAt,
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addProduct = (prod: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      code: prod.code || `PRD-${String(products.length + 1).padStart(3, '0')}`,
    };
    setProducts((prev) => [...prev, newProd]);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setLots((prev) => prev.filter((l) => l.productId !== id));
  };

  // No Estoque, produtos com mesmo LOTE, Validade e Código somam no mesmo card!
  const addLot = (lot: Omit<LotItem, 'id'>) => {
    const matchedProd = products.find((p) => p.id === lot.productId);
    const targetCode = (lot.productCode || matchedProd?.code || '').trim().toUpperCase();
    const targetLotNum = lot.lotNumber.trim().toUpperCase();
    const targetExp = lot.expiryDate.trim();

    const existingLotIndex = lots.findIndex((l) => {
      const matchLot = l.lotNumber.trim().toUpperCase() === targetLotNum;
      const matchExp = l.expiryDate.trim() === targetExp;
      const matchCode = (l.productCode || '').trim().toUpperCase() === targetCode;
      return matchLot && matchExp && matchCode;
    });

    if (existingLotIndex >= 0) {
      // Mesmos lote, validade e código: SOMA com o lote existente!
      setLots((prev) =>
        prev.map((l, idx) =>
          idx === existingLotIndex
            ? {
                ...l,
                quantity: l.quantity + lot.quantity,
                initialQuantity: l.initialQuantity + lot.quantity,
                status: 'EM_ESTOQUE',
              }
            : l
        )
      );
    } else {
      // Se tiver algo diferente, cadastra como um novo card/produto no estoque!
      const newLot: LotItem = {
        ...lot,
        productCode: targetCode,
        id: `lot-${Date.now()}`,
      };
      setLots((prev) => [newLot, ...prev]);
    }
  };

  const deleteLot = (id: string) => {
    setLots((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLotQuantity = (lotId: string, delta: number, reason?: string) => {
    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          const newQty = Math.max(0, lot.quantity + delta);
          return {
            ...lot,
            quantity: newQty,
            status: newQty === 0 ? 'ESGOTADO' : lot.status,
          };
        }
        return lot;
      })
    );

    if (delta < 0) {
      // If loss or write-off
      const newAlert: SystemAlert = {
        id: `alt-loss-${Date.now()}`,
        title: 'Ajuste de estoque/perda registrado',
        description: `Baixa de ${Math.abs(delta)} unidades. Motivo: ${reason || 'Ajuste manual'}.`,
        urgency: 'ATENCAO',
        category: 'ESTOQUE',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
  };

  const dispatchRecallAlert = (lotNumber: string, message: string) => {
    setLots((prev) =>
      prev.map((l) =>
        l.lotNumber.trim().toUpperCase() === lotNumber.trim().toUpperCase()
          ? { ...l, status: 'RECOLHIDO' }
          : l
      )
    );

    const recallAlert: SystemAlert = {
      id: `alt-recall-${Date.now()}`,
      title: `RECALL SANITÁRIO: Lote ${lotNumber}`,
      description: message,
      urgency: 'URGENTE',
      category: 'VALIDADE',
      date: new Date().toISOString().split('T')[0],
      actionText: 'Ver Rastreabilidade',
      actionTarget: 'rastreamento',
      resolved: false,
    };
    setAlerts((prev) => [recallAlert, ...prev]);
  };

  // Notes / Anotações
  const addNote = (content: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      content: content.trim(),
      createdAt: `${dateStr} às ${timeStr}`,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNote = (id: string, content: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content: content.trim(), updatedAt: `${dateStr} às ${timeStr}` } : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // --- Dedicated Production Module Methods (Sorvetes & Açaí) ---
  const addFlavor = (flavor: Omit<FlavorItem, 'id'>) => {
    const newFlavor: FlavorItem = {
      ...flavor,
      id: `flv-${Date.now()}`,
    };
    setFlavors((prev) => [newFlavor, ...prev]);
    return newFlavor;
  };

  const updateFlavor = (id: string, updated: Partial<FlavorItem>) => {
    setFlavors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updated } : f))
    );
  };

  const deleteFlavor = (id: string) => {
    setFlavors((prev) => prev.filter((f) => f.id !== id));
  };

  const createProductionLot = (lotData: Omit<ProductionLotItem, 'id' | 'createdAt'>) => {
    const now = new Date();
    const todayStr = lotData.manufacturingDate || now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const createdAt = `${todayStr} ${timeStr}`;

    // Generate standard lot code if not provided or format as SDDMM-NN or ADDMM-NN
    let finalLotCode = lotData.lotNumber.trim().toUpperCase();
    if (!finalLotCode) {
      const prefix = lotData.productType === 'SORVETE' ? 'S' : 'A';
      const [year, month, day] = todayStr.split('-');
      const ddmm = `${day || '01'}${month || '01'}`;
      const existingToday = productionLots.filter(
        (l) => l.productType === lotData.productType && l.manufacturingDate === todayStr
      );
      const seq = String(existingToday.length + 1).padStart(2, '0');
      finalLotCode = `${prefix}${ddmm}-${seq}`;
    }

    // Default 365 days expiry if not set
    let finalExpiry = lotData.expiryDate;
    if (!finalExpiry) {
      const mDate = new Date(todayStr);
      mDate.setDate(mDate.getDate() + 365);
      finalExpiry = mDate.toISOString().split('T')[0];
    }

    const newProdLot: ProductionLotItem = {
      ...lotData,
      id: `plot-${Date.now()}`,
      lotNumber: finalLotCode,
      manufacturingDate: todayStr,
      expiryDate: finalExpiry,
      createdAt,
    };

    // 1. Salvar no estoque interno da produção
    setProductionLots((prev) => [newProdLot, ...prev]);

    // 2. Interligar com o Estoque Geral do Sistema (conforme especificado na página 15 e áudio)
    const generalProdName =
      lotData.productType === 'SORVETE'
        ? `Sorvete ${lotData.flavorName || 'Especial'}`
        : 'Açaí Tradicional';

    let generalProduct = products.find(
      (p) => p.name.trim().toLowerCase() === generalProdName.trim().toLowerCase()
    );

    if (!generalProduct) {
      const newProdId = `prod-${Date.now()}`;
      const newProdCode = `${lotData.productType === 'SORVETE' ? 'SOR' : 'ACA'}-${Date.now().toString().slice(-4)}`;
      const createdProd: Product = {
        id: newProdId,
        code: newProdCode,
        name: generalProdName,
        category: lotData.productType === 'SORVETE' ? 'Sorvete' : 'Açaí',
        minStock: 10,
        unit: lotData.unitMeasure === 'kg' ? 'Kg' : 'Litro',
      };
      setProducts((prev) => [...prev, createdProd]);
      generalProduct = createdProd;
    }

    // Adiciona o lote no estoque geral (lots)
    addLot({
      lotNumber: finalLotCode,
      productId: generalProduct.id,
      productCode: generalProduct.code,
      productName: generalProdName,
      quantity: lotData.quantity,
      initialQuantity: lotData.initialQuantity || lotData.quantity,
      manufacturingDate: todayStr,
      expiryDate: finalExpiry,
      unitCost: +(lotData.unitPrice * 0.55).toFixed(2),
      unitPrice: lotData.unitPrice || 75.0,
      status: 'EM_ESTOQUE',
      observations: `Produção interna (${lotData.packaging} ${lotData.unitMeasure}). ${lotData.observations || ''}`.trim(),
    });

    // Registra batelada em productions para manter histórico e relatórios consolidados
    const newProdRec: ProductionRecord = {
      id: `prod-${Date.now()}`,
      lotNumber: finalLotCode,
      productId: generalProduct.id,
      productName: generalProdName,
      quantityProduced: lotData.quantity,
      unitCost: +(lotData.unitPrice * 0.55).toFixed(2),
      totalCost: +((lotData.unitPrice * 0.55) * lotData.quantity).toFixed(2),
      losses: 0,
      responsiblePerson: 'Equipe de Produção',
      ingredients: [],
      productionDate: todayStr,
      expiryDate: finalExpiry,
      notes: `Embalagem: ${lotData.packaging} (${lotData.unitMeasure}) • Lote gerado via módulo de produção.`,
    };
    setProductions((prev) => [newProdRec, ...prev]);

    // Alerta informativo no sistema
    const newAlert: SystemAlert = {
      id: `alt-plot-${Date.now()}`,
      title: `Nova produção finalizada: ${finalLotCode}`,
      description: `${lotData.quantity} unidades de ${generalProdName} produzidas e integradas ao estoque geral.`,
      urgency: 'INFORMATIVO',
      category: 'PRODUCAO',
      date: todayStr,
      actionText: 'Ver Lote',
      actionTarget: 'producao',
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);

    return { success: true, lot: newProdLot };
  };

  const updateProductionLotQty = (lotId: string, delta: number, reason?: string) => {
    setProductionLots((prev) =>
      prev.map((l) => (l.id === lotId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
    );

    if (delta < 0) {
      const newAlert: SystemAlert = {
        id: `alt-ploss-${Date.now()}`,
        title: 'Perda registrada na produção',
        description: `Baixa de ${Math.abs(delta)} unidades. Motivo: ${reason || 'Descarte/Ajuste interno'}.`,
        urgency: 'ATENCAO',
        category: 'PRODUCAO',
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  // Production Notes
  const addProductionNote = (content: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNote = {
      id: `pnote-${Date.now()}`,
      content: content.trim(),
      createdAt: `${dateStr} às ${timeStr}`,
    };
    setProductionNotes((prev) => [newNote, ...prev]);
  };

  const updateProductionNote = (id: string, content: string) => {
    setProductionNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: content.trim() } : n))
    );
  };

  const deleteProductionNote = (id: string) => {
    setProductionNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateProductionLabelSettings = (newSettings: Partial<ProductionLabelSettings>) => {
    setProductionLabelSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    localStorage.clear();
    setIsDemoMode(true);
    setSettings(initialCompanySettings);
    setProducts(initialProducts);
    setLots(initialLots);
    setCustomers(initialCustomers);
    setOrders(initialOrders);
    setReceivables(initialReceivables);
    setTransactions(initialTransactions);
    setProductions(initialProductions);
    setAlerts(initialAlerts);
    setNotes(initialNotes);
    setFlavors(initialFlavors);
    setBaseIceCreamIngredients(initialBaseIceCreamIngredients);
    setBaseAcaiIngredients(initialBaseAcaiIngredients);
    setProductionLots(initialProductionLots);
    setProductionNotes(initialProductionNotes);
    setProductionLabelSettings(initialProductionLabelSettings);
  };

  const clearAllData = (options?: { keepProducts?: boolean }) => {
    setIsDemoMode(false);
    setLots([]);
    setCustomers([]);
    setOrders([]);
    setReceivables([]);
    setTransactions([]);
    setProductions([]);
    setAlerts([]);
    setNotes([]);
    setProductionLots([]);
    setProductionNotes([]);
    
    if (!options?.keepProducts) {
      setProducts([]);
    }

    localStorage.removeItem(`${STORAGE_KEY}_lots`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_receivables`);
    localStorage.removeItem(`${STORAGE_KEY}_transactions`);
    localStorage.removeItem(`${STORAGE_KEY}_productions`);
    localStorage.removeItem(`${STORAGE_KEY}_alerts`);
    localStorage.removeItem(`${STORAGE_KEY}_notes`);
    localStorage.removeItem(`${STORAGE_KEY}_production_lots`);
    localStorage.removeItem(`${STORAGE_KEY}_production_notes`);
    if (!options?.keepProducts) {
      localStorage.removeItem(`${STORAGE_KEY}_products`);
    }
    localStorage.setItem(`${STORAGE_KEY}_is_demo`, JSON.stringify(false));
  };

  // WhatsApp message generator (page 6)
  const generateWhatsAppMessage = (receivable: ReceivableItem) => {
    const formattedAmount = receivable.amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    const formattedDate = receivable.dueDate.split('-').reverse().join('/');
    
    let statusText = `com vencimento em ${formattedDate}`;
    if (receivable.status === 'ATRASADO') {
      statusText = `vencida desde ${formattedDate} (${receivable.daysOverdue} dias em atraso)`;
    } else if (receivable.status === 'HOJE') {
      statusText = `com vencimento hoje (${formattedDate})`;
    }

    return `Olá ${receivable.customerName}, tudo bem? Aqui é da ${settings.companyName}.\n\nConsta em nosso sistema uma pendência no valor de *${formattedAmount}*, ${statusText}.\n\nPara facilitar o pagamento via Pix:\n🔑 Chave Pix (${settings.pixKeyType}): *${settings.pixKey}*\nFavorecido: ${settings.companyName}\n\nAssim que efetuar o pagamento, por favor nos envie o comprovante. Qualquer dúvida estamos à disposição!`;
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        currentUserRole,
        setCurrentUserRole,
        isDemoMode,
        settings,
        updateSettings,
        products,
        lots,
        customers,
        orders,
        receivables,
        transactions,
        productions,
        alerts,
        dashboardStats,
        financialSummary,
        notes,
        targetClientForCreditLimitEdit,
        setTargetClientForCreditLimitEdit,
        targetLotForAdjust,
        setTargetLotForAdjust,
        createOrder,
        darBaixaPedido,
        createProduction,
        receivePayment,
        payPayableTransaction,
        addTransaction,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        deleteProduct,
        addLot,
        deleteLot,
        updateLotQuantity,
        resolveAlert,
        dispatchRecallAlert,
        resetAllData,
        clearAllData,
        generateWhatsAppMessage,
        addNote,
        updateNote,
        deleteNote,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
