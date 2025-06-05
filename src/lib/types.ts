
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
