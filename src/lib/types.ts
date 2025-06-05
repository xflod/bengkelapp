
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
  orderDate: string; 
  items: SupplierOrderItem[];
  status: SupplierOrderStatus;
  notes?: string; 
  supplierName?: string; 
  totalOrderQuantity?: number; 
  receivedDate?: string;
  invoiceNumber?: string;
  receivingNotes?: string;
  createdAt: string;
  updatedAt: string;
}


export interface Sale {
  id: string;
  date: string; 
  customerId?: string;
  customerName?: string; 
  items: SaleItem[];
  subTotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehicleDetails?: string;
  serviceType: string;
  scheduledDateTime: string; 
  status: 'booked' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

// Employee Management Types
export type EmployeeStatus = 'Aktif' | 'Tidak Aktif' | 'Resign';
export type PayrollFrequency = 'Harian' | 'Mingguan' | 'Bulanan';

export interface Employee {
  id: string;
  name: string;
  position: string;
  joinDate: string; 
  phone?: string;
  address?: string;
  status: EmployeeStatus;
  payrollFrequency: PayrollFrequency;
  baseSalary: number;
  loanNotes?: string; 
  performanceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Loan Management Types
export type LoanStatus = 'Aktif' | 'Lunas' | 'Sebagian Lunas' | 'Dihapuskan';

export interface Loan {
  id: string;
  employeeId: string;
  loanDate: string; 
  loanAmount: number;
  reason?: string;
  status: LoanStatus;
  remainingBalance: number;
  repaymentNotes?: string; 
  createdAt: string;
  updatedAt: string;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  paymentDate: string; 
  amountPaid: number;
  notes?: string;
  createdAt: string;
}

// Financial Ledger Types
export type AccountEntryType = 'Pelanggan' | 'Partner Bengkel' | 'Supplier' | 'Operasional & Lainnya';
export type AccountEntryNature = 'Piutang Usaha' | 'Hutang Usaha' | 'Piutang Lainnya' | 'Hutang Lainnya';
export type AccountEntryStatus = 'Belum Lunas' | 'Sebagian Lunas' | 'Lunas' | 'Dihapuskan';

export interface AccountEntry {
  id: string;
  entityType: AccountEntryType;
  entityName: string; // e.g., Customer name, Supplier name, "Angsuran Bank BCA", "Sewa Ruko"
  entryNature: AccountEntryNature;
  entryDate: string; // ISO string
  dueDate?: string; // ISO string, optional
  initialAmount: number;
  remainingAmount: number;
  description: string; // Purpose of the transaction
  status: AccountEntryStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface AccountPayment {
  id: string;
  accountEntryId: string; // Foreign key to AccountEntry
  paymentDate: string; // ISO string
  amountPaid: number;
  paymentMethod?: string; // e.g., 'Tunai', 'Transfer Bank A', 'QRIS' - optional
  notes?: string; // Optional notes for this specific payment
  createdAt: string; // ISO string
}
