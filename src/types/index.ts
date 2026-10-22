export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'A_PRAZO';

export type PaymentStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO';

export type AlertUrgency = 'URGENTE' | 'ATENCAO' | 'INFORMATIVO';

export type AlertCategory = 'ESTOQUE' | 'FINANCEIRO' | 'PRODUCAO' | 'VALIDADE' | 'CLIENTES' | 'GERAL';

export type UserRole = 'ADMINISTRADOR' | 'FINANCEIRO' | 'PRODUCAO' | 'VENDEDOR';

export interface LotItem {
  id: string;
  lotNumber: string; // ex: AC20261007 or ACA-07102026-01
  productId: string;
  productCode?: string; // Código do produto (SKU / código interno)
  productName: string;
  quantity: number; // current stock units
  initialQuantity: number;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  unitCost: number; // ex: 42.00
  unitPrice: number; // ex: 75.00
  status: 'EM_ESTOQUE' | 'PROXIMO_VENCIMENTO' | 'VENCIDO' | 'ESGOTADO' | 'RECOLHIDO';
  observations?: string;
}

export interface Product {
  id: string;
  code?: string; // Código do produto (ex: PRD-001)
  name: string; // ex: Açaí 10 L
  category: string; // ex: Açaí, Polpa, Embalagem
  minStock: number; // estoque mínimo
  unit: string; // Unidade, Litro, Balde, Caixa
  description?: string;
  barcode?: string;
}

export interface OrderItem {
  productId: string;
  productCode?: string;
  productName: string;
  lotNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  totalAmount: number;
  netAmount: number; // after card fee if applicable
  cardFeePercentage?: number; // e.g. 3.5%
  cardFeeAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  darBaixaImediata?: boolean;
  dueDate?: string; // YYYY-MM-DD for A PRAZO
  paidAt?: string;
  createdAt: string;
  notes?: string;
  paidAmount?: number; // valor acumulado já pago do pedido
  remainingAmount?: number; // saldo restante em aberto do pedido
}

export interface Customer {
  id: string;
  name: string; // ex: João da Silva
  phone: string; // ex: (11) 98765-4321
  address: string; // ex: Rua das Palmeiras, 142 - Centro
  document?: string; // CPF or CNPJ
  totalPurchased: number; // Total comprado
  openBalance: number; // Valor em aberto
  daysOverdue: number; // Dias em atraso
  creditLimit: number; // ex: 1000
  createdAt: string;
  notes?: string;
}

export interface ReceivableItem {
  id: string;
  orderId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number; // saldo restante
  originalAmount?: number; // valor inicial da cobrança
  paidAmount?: number; // valor já amortizado
  dueDate: string; // YYYY-MM-DD
  status: 'ATRASADO' | 'HOJE' | 'PENDENTE' | 'PAGO';
  daysOverdue: number;
  description: string;
  paidAt?: string;
}

export type TransactionType = 'ENTRADA' | 'SAIDA' | 'A_PAGAR';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TransactionType;
  amount: number; // valor original
  remainingAmount?: number; // valor restante a pagar (quando A_PAGAR)
  paidAmount?: number; // total já pago
  dueDate?: string; // prazo/vencimento para pagamento (quando A_PAGAR)
  status?: 'PENDENTE' | 'PAGO';
  category: 'Vendas' | 'Fornecedor' | 'Manutenção' | 'Folha de Pagamento' | 'Insumos' | 'Impostos' | 'Outros';
  relatedOrderId?: string;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface NoteItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  cost: number;
}

export interface ProductionRecord {
  id: string;
  lotNumber: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  unitCost: number;
  totalCost: number;
  losses: number; // perdas registradas
  responsiblePerson: string;
  ingredients: Ingredient[];
  productionDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  urgency: AlertUrgency;
  category: AlertCategory;
  date: string;
  actionText?: string;
  actionTarget?: string; // tab name or action trigger
  resolved: boolean;
}

export interface CompanySettings {
  companyName: string;
  tradeName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  pixKey: string;
  pixKeyType: 'CNPJ' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA';
  logoUrl?: string;
  defaultCardFee: number; // percentage (e.g., 3.5%)
  defaultCreditLimit: number;
  blockDelinquentCustomers: boolean;
  alertDaysBeforeExpiry: number; // e.g. 30 days
  lowStockThresholdDays: number;
}

export interface UserPermission {
  role: UserRole;
  name: string;
  email: string;
  allowedViews: string[];
}

export interface NutritionItemRow {
  per100g: string;
  perServing: string;
  vdPercent: string;
}

export interface NutritionFactsTable {
  servingsPerPackage: string; // "20"
  servingSize: string; // "60 g (1 bola)"
  energeticValue: NutritionItemRow;
  carbohydrates: NutritionItemRow;
  totalSugars: NutritionItemRow;
  addedSugars: NutritionItemRow;
  proteins: NutritionItemRow;
  totalFat: NutritionItemRow;
  saturatedFat: NutritionItemRow;
  transFat: NutritionItemRow;
  dietaryFiber: NutritionItemRow;
  sodium: NutritionItemRow;
}

export interface FlavorItem {
  id: string;
  name: string; // ex: Chocolate, Morango, Flocos, Baunilha, etc.
  ingredients: { name: string; quantity: string }[];
  unitCost?: number;
  allergens: string; // ex: "CONTÉM DERIVADOS DE LEITE E SOJA..."
  nutritionTable: NutritionFactsTable;
}

export interface ProductionLotItem {
  id: string;
  productType: 'SORVETE' | 'ACAI';
  flavorName?: string; // para Sorvete
  lotNumber: string; // Ex: S2010-01 ou A2010-01
  packaging: string; // Caixa, Pote, Tapuer, Balde 10L, etc.
  unitMeasure: 'L' | 'kg';
  quantity: number; // quantidade em estoque da produção
  initialQuantity: number;
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD (365 dias)
  unitPrice: number;
  observations?: string;
  createdAt: string;
}

export interface ProductionLabelSettings {
  sorvete: {
    manufacturer: string;
    address: string;
    cnpj: string;
    stateRegistration: string;
    contact: string;
    originText: string;
    defaultNetContent: string;
    validityText: string;
    glutenText: string;
    baseAllergens: string;
    baseIngredients: string;
  };
  acai: {
    manufacturer: string;
    address: string;
    cnpj: string;
    stateRegistration: string;
    contact: string;
    originText: string;
    defaultNetContent: string;
    validityText: string;
    glutenText: string;
    allergens: string;
    ingredients: string;
    nutritionTable: NutritionFactsTable;
  };
}
