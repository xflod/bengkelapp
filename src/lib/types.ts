
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
}

export type ProductCategory = 'Suku Cadang' | 'Aksesoris' | 'Oli & Cairan' | 'Jasa' | 'Lainnya';
export type PriceTierName = 'default' | 'partner' | 'servicePackage';

export interface SellingPriceTier {
  tierName: PriceTierName;
  price: number;
}

export interface Product {
  id: string; 
  sku: string;
  name: string;
  category: ProductCategory;
  costPrice: number; 
  sellingPrices: SellingPriceTier[]; 
  stockQuantity: number; 
  lowStockThreshold: number; 
  description?: string;
  isActive: boolean; 
  createdAt: string; 
  updatedAt: string; 
  supplierId?: string; 
  imageUrl?: string;
}


export interface SaleItem { 
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; 
  totalPrice: number; 
  category?: ProductCategory; 
  priceTierUsed?: PriceTierName; 
}

export interface ReportSaleItem { 
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number; 
  costPrice: number; 
  totalRevenue: number; 
  totalCOGS: number; 
  profit: number; 
}


export interface SaleTransactionForReport {
  id: string; 
  transaction_id_client?: string; 
  date: string; 
  items: ReportSaleItem[];
  subtotal: number;
  discount_applied: number;
  final_amount: number;
  total_cogs: number;
  total_profit: number;
  payment_method: 'Tunai' | 'Transfer';
  customer_name?: string;
  service_notes?: string;
  type: 'Regular' | 'Partner' | 'Service';
  created_at: string; 
}


export interface SupplierOrderItem {
  productId: string;
  productName: string;
  sku: string;
  orderQuantity: number;
  quantityReceived?: number; 
  actualCostPrice?: number;
}

export type SupplierOrderStatus = 'Draf Order' | 'Dipesan ke Supplier' | 'Sebagian Diterima' | 'Diterima Lengkap' | 'Dibatalkan';


export interface SupplierOrder {
  id: string; 
  client_order_id?: string;
  order_date: string; 
  items: SupplierOrderItem[];
  status: SupplierOrderStatus;
  notes?: string; 
  supplier_name?: string; 
  total_order_quantity?: number; 
  received_date?: string;
  invoice_number?: string;
  receiving_notes?: string;
  created_at: string;
  updated_at: string;
}


export type EmployeeStatus = 'Aktif' | 'Tidak Aktif' | 'Resign';
export type PayrollFrequency = 'Harian' | 'Mingguan' | 'Bulanan';


export interface Employee {
  id: string;
  name: string;
  position: string;
  join_date: string; 
  phone?: string;
  address?: string;
  status: EmployeeStatus;
  payroll_frequency: PayrollFrequency;
  base_salary: number;
  loan_notes?: string; 
  performance_notes?: string;
  created_at: string;
  updated_at: string;
}


export type LoanStatus = 'Aktif' | 'Lunas' | 'Sebagian Lunas' | 'Dihapuskan';


export interface Loan {
  id: string;
  employee_id: string; 
  loan_date: string; 
  loan_amount: number;
  reason?: string;
  status: LoanStatus;
  remaining_balance: number;
  repayment_notes?: string; 
  created_at: string;
  updated_at: string;
}


export interface LoanInstallment {
  id: string;
  loan_id: string; 
  payment_date: string; 
  amount_paid: number;
  notes?: string;
  created_at: string;
}


export type AccountEntryType = 'Pelanggan' | 'Partner Bengkel' | 'Supplier' | 'Operasional & Lainnya';
export type AccountEntryNature = 'Piutang Usaha' | 'Hutang Usaha' | 'Piutang Lainnya' | 'Hutang Lainnya';
export type AccountEntryStatus = 'Belum Lunas' | 'Sebagian Lunas' | 'Lunas' | 'Dihapuskan';


export interface AccountEntry {
  id: string; 
  entityType: AccountEntryType; 
  entityName: string; 
  entryNature: AccountEntryNature; 
  entryDate: string; 
  dueDate?: string; 
  initialAmount: number; 
  remainingAmount: number; 
  description: string;
  status: AccountEntryStatus;
  createdAt: string; 
  updatedAt: string; 
}


export interface AccountPayment {
  id: string; 
  accountEntryId: string; 
  paymentDate: string; 
  amountPaid: number; 
  paymentMethod?: string; 
  notes?: string;
  createdAt: string; 
}


export type SavingsGoalStatus = 'Aktif' | 'Tercapai' | 'Dibatalkan';


export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  start_date: string; 
  target_date?: string; 
  status: SavingsGoalStatus;
  notes?: string;
  created_at: string; 
  updated_at: string; 
}


export interface SavingsTransaction {
  id: string;
  goal_id: string; 
  transaction_date: string; 
  amount: number; 
  type: 'Setoran' | 'Penarikan'; 
  notes?: string;
  created_at: string;
}


export type ExpenseCategory = 'Operasional Bengkel' | 'Gaji & Komisi' | 'Pembelian Alat & Aset' | 'Promosi & Marketing' | 'Administrasi & Pajak' | 'Biaya Tak Terduga' | 'Lainnya';


export interface Expense {
  id: string; 
  expenseDate: string; 
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  createdAt: string; 
  updatedAt: string; 
}

// New Supplier Type
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  whatsapp_number?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
    
