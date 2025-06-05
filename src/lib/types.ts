import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
}

// Placeholder types for core features - to be expanded
export interface Product {
  id: string;
  name: string;
  category: 'service' | 'part' | 'display';
  costPrice: number;
  sellingPrices: { tier: string; price: number }[];
  stockQuantity: number;
  lowStockThreshold: number;
  supplierId?: string;
  imageUrl?: string;
  description?: string;
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
