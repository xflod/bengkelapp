
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
  // Optional fields from original generic type, not strictly enforced by inventory's mock data
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
