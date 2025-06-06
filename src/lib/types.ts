
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
  id: string; // In Supabase, this will likely be a number (bigint) if auto-incrementing, or string if UUID
  sku: string;
  name: string;
  category: ProductCategory;
  costPrice: number; // Supabase: cost_price
  sellingPrices: SellingPriceTier[]; // Supabase: selling_prices (JSONB)
  stockQuantity: number; // Supabase: stock_quantity
  lowStockThreshold: number; // Supabase: low_stock_threshold
  description?: string;
  isActive: boolean; // Supabase: is_active
  createdAt: string; // Supabase: created_at (TIMESTAMPTZ)
  updatedAt: string; // Supabase: updated_at (TIMESTAMPTZ)
  supplierId?: string; 
  imageUrl?: string;
}


export interface SaleItem { // Used in POS cart
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // Selling price per unit
  totalPrice: number; // quantity * unitPrice
  category?: ProductCategory; // Optional, useful for logic
  priceTierUsed?: PriceTierName; // To track which price tier was used
}

export interface ReportSaleItem { // Stored for reporting
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number; // Selling price per unit
  costPrice: number; // Cost price per unit at the time of sale
  totalRevenue: number; // quantity * unitPrice (effectively)
  totalCOGS: number; // quantity * costPrice
  profit: number; // totalRevenue - totalCOGS for this item line
}

// Supabase equivalent for sales_transactions table
export interface SaleTransactionForReport {
  id: string; // client-generated or from Supabase after insert
  transaction_id_client?: string; // if client generates one before DB id
  date: string; // ISO string date of transaction
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
  created_at: string; // ISO string
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

// Supabase equivalent for supplier_orders table
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


// Employee Management Types
export type EmployeeStatus = 'Aktif' | 'Tidak Aktif' | 'Resign';
export type PayrollFrequency = 'Harian' | 'Mingguan' | 'Bulanan';

// Supabase equivalent for employees table
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

// Loan Management Types
export type LoanStatus = 'Aktif' | 'Lunas' | 'Sebagian Lunas' | 'Dihapuskan';

// Supabase equivalent for employee_loans table
export interface Loan {
  id: string;
  employee_id: string; // foreign key to employees.id
  loan_date: string; 
  loan_amount: number;
  reason?: string;
  status: LoanStatus;
  remaining_balance: number;
  repayment_notes?: string; 
  created_at: string;
  updated_at: string;
}

// Supabase equivalent for loan_installments table
export interface LoanInstallment {
  id: string;
  loan_id: string; // foreign key to employee_loans.id
  payment_date: string; 
  amount_paid: number;
  notes?: string;
  created_at: string;
}

// Financial Ledger Types
export type AccountEntryType = 'Pelanggan' | 'Partner Bengkel' | 'Supplier' | 'Operasional & Lainnya';
export type AccountEntryNature = 'Piutang Usaha' | 'Hutang Usaha' | 'Piutang Lainnya' | 'Hutang Lainnya';
export type AccountEntryStatus = 'Belum Lunas' | 'Sebagian Lunas' | 'Lunas' | 'Dihapuskan';

// Supabase equivalent for account_ledger_entries table
export interface AccountEntry {
  id: string; // Changed from number to string for consistency with other IDs if needed, or keep as number if DB is number
  entityType: AccountEntryType; // Supabase: entity_type
  entityName: string; // Supabase: entity_name
  entryNature: AccountEntryNature; // Supabase: entry_nature
  entryDate: string; // Supabase: entry_date (DATE)
  dueDate?: string; // Supabase: due_date (DATE)
  initialAmount: number; // Supabase: initial_amount
  remainingAmount: number; // Supabase: remaining_amount
  description: string;
  status: AccountEntryStatus;
  createdAt: string; // Supabase: created_at (TIMESTAMPTZ)
  updatedAt: string; // Supabase: updated_at (TIMESTAMPTZ)
}

// Supabase equivalent for account_ledger_payments table
export interface AccountPayment {
  id: string; // Changed from number to string
  accountEntryId: string; // Supabase: account_entry_id (foreign key)
  paymentDate: string; // Supabase: payment_date (DATE)
  amountPaid: number; // Supabase: amount_paid
  paymentMethod?: string; // Supabase: payment_method
  notes?: string;
  createdAt: string; // Supabase: created_at (TIMESTAMPTZ)
}

// Savings Book Types
export type SavingsGoalStatus = 'Aktif' | 'Tercapai' | 'Dibatalkan';

// Supabase equivalent for savings_goals table
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

// Supabase equivalent for savings_transactions table
export interface SavingsTransaction {
  id: string;
  goal_id: string; 
  transaction_date: string; 
  amount: number; 
  type: 'Setoran' | 'Penarikan'; 
  notes?: string;
  created_at: string;
}

// Expense Recording Types
export type ExpenseCategory = 'Operasional Bengkel' | 'Gaji & Komisi' | 'Pembelian Alat & Aset' | 'Promosi & Marketing' | 'Administrasi & Pajak' | 'Biaya Tak Terduga' | 'Lainnya';

// Supabase equivalent for expenses_data table
export interface Expense {
  id: string; // Changed from number to string
  expenseDate: string; // Supabase: expense_date (DATE)
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  createdAt: string; // Supabase: created_at (TIMESTAMPTZ)
  updatedAt: string; // Supabase: updated_at (TIMESTAMPTZ)
}

    