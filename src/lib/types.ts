
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
  // Potentially add costPriceAtOrderTime if needed for audit
}

export type SupplierOrderStatus = 'Draf Order' | 'Dipesan ke Supplier' | 'Sebagian Diterima' | 'Diterima Lengkap' | 'Dibatalkan';

export interface SupplierOrder {
  id: string; // e.g., SO-YYYYMMDD-XXXXX
  orderDate: string; // ISO string
  items: SupplierOrderItem[];
  status: SupplierOrderStatus;
  notes?: string; // Optional notes for the entire order
  supplierName?: string; // Optional
  totalOrderQuantity?: number; // Sum of all item quantities
  // Fields for receiving audit can be added later
  // e.g., receivedDate, receivedItemsDetail
  createdAt: string;
  updatedAt: string;
}


export interface Sale {
  id: string;
  date: string; // ISO string
  customerId?: string;
  customerName?: string; // Denormalized for quick display
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
  scheduledDateTime: string; // ISO string
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
  joinDate: string; // ISO Date string
  phone?: string;
  address?: string;
  status: EmployeeStatus;
  payrollFrequency: PayrollFrequency;
  baseSalary: number;
  loanNotes?: string; // Existing field, will be less used with new system
  performanceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Loan Management Types
export type LoanStatus = 'Aktif' | 'Lunas' | 'Sebagian Lunas' | 'Dihapuskan';

export interface Loan {
  id: string;
  employeeId: string;
  loanDate: string; // ISO Date string
  loanAmount: number;
  reason?: string;
  status: LoanStatus;
  remainingBalance: number;
  repaymentNotes?: string; // General notes about repayment agreement
  createdAt: string;
  updatedAt: string;
}

export interface LoanInstallment {
  id: string;
  loanId: string;
  paymentDate: string; // ISO Date string
  amountPaid: number;
  notes?: string;
  createdAt: string;
}

// Type for items received in a supplier order - for audit
export interface SupplierOrderReceivedItem {
  productId: string;
  productName: string; // for display convenience
  sku: string; // for display convenience
  quantityOrdered: number;
  quantityReceived: number;
  costPriceWhenReceived?: number; // Actual cost when received, per item
  receivingNotes?: string;
}
