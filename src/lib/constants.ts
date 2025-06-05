import type { NavItem } from '@/lib/types';
import { LayoutDashboard, ShoppingCart, CalendarDays, Package, BarChartBig, Users, Truck } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Penjualan',
    href: '/sales',
    icon: ShoppingCart,
  },
  {
    title: 'Jadwal Servis',
    href: '/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Inventaris',
    href: '/inventory',
    icon: Package,
  },
  {
    title: 'Laporan',
    href: '/reports/profit',
    icon: BarChartBig,
  },
  // Optional future items
  // {
  //   title: 'Pelanggan',
  //   href: '/customers',
  //   icon: Users,
  // },
  // {
  //   title: 'Supplier',
  //   href: '/suppliers',
  //   icon: Truck,
  // },
];
