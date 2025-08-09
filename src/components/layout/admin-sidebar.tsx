'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Bell,
  FileText,
  AlertTriangle,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { clsx } from 'clsx';

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  permission?: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'User Management',
    icon: Users,
    permission: 'users.read',
    children: [
      { name: 'All Users', href: '/dashboard/users', icon: Users },
      { name: 'Verification Queue', href: '/dashboard/users/verification', icon: Shield },
      { name: 'Suspended Users', href: '/dashboard/users/suspended', icon: AlertTriangle },
    ],
  },
  {
    name: 'Product Management',
    icon: Package,
    permission: 'products.read',
    children: [
      { name: 'All Products', href: '/dashboard/products', icon: Package },
      { name: 'Pending Approval', href: '/dashboard/products/pending', icon: AlertTriangle },
      { name: 'Categories', href: '/dashboard/categories', icon: FileText },
    ],
  },
  {
    name: 'Order Management',
    icon: ShoppingCart,
    permission: 'orders.read',
    children: [
      { name: 'All Orders', href: '/dashboard/orders', icon: ShoppingCart },
      { name: 'Disputes', href: '/dashboard/disputes', icon: AlertTriangle },
      { name: 'Refunds', href: '/dashboard/orders/refunds', icon: CreditCard },
    ],
  },
  {
    name: 'Content Moderation',
    icon: FileText,
    permission: 'content.read',
    children: [
      { name: 'All Content', href: '/dashboard/content', icon: FileText },
      { name: 'Flagged Content', href: '/dashboard/content/flagged', icon: AlertTriangle },
      { name: 'Reported Content', href: '/dashboard/content/reported', icon: Shield },
    ],
  },
  {
    name: 'Financial Management',
    icon: CreditCard,
    permission: 'finance.read',
    children: [
      { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
      { name: 'Settlements', href: '/dashboard/settlements', icon: Database },
      { name: 'Wallet Management', href: '/dashboard/wallets', icon: Shield },
    ],
  },
  {
    name: 'Analytics & Reports',
    icon: BarChart3,
    permission: 'analytics.read',
    children: [
      { name: 'Platform Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Financial Reports', href: '/dashboard/reports/financial', icon: FileText },
      { name: 'User Reports', href: '/dashboard/reports/users', icon: Users },
    ],
  },
  {
    name: 'System Management',
    icon: Settings,
    permission: 'system.read',
    children: [
      { name: 'System Configuration', href: '/dashboard/system/config', icon: Settings },
      { name: 'Notification Templates', href: '/dashboard/system/notifications', icon: Bell },
      { name: 'Feature Flags', href: '/dashboard/system/features', icon: Shield },
      { name: 'API Management', href: '/dashboard/system/api', icon: Database },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href ? pathname === item.href : false;

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={clsx(
              'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md group',
              'text-gray-300 hover:bg-gray-700 hover:text-white',
              level > 0 && 'ml-4'
            )}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.name}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href!}
        className={clsx(
          'flex items-center px-2 py-2 text-sm font-medium rounded-md group',
          isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
          level > 0 && 'ml-8'
        )}
      >
        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-indigo-400" />
            <span className="ml-2 text-white text-lg font-semibold">
              Vikareta Admin
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map(item => renderNavigationItem(item))}
          </nav>
        </div>
      </div>
    </div>
  );
}