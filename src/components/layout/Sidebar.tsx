'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBagIcon },
  { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
  { name: 'Services', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
  { name: 'Categories', href: '/dashboard/categories', icon: TagIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ClipboardDocumentListIcon },
  { name: 'Payments', href: '/dashboard/payments', icon: BanknotesIcon },
  { name: 'Support', href: '/dashboard/support', icon: ExclamationTriangleIcon },
  { name: 'Admins', href: '/dashboard/admins', icon: UserGroupIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="admin-sidebar">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Vikareta Admin</h1>
      </div>
      
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                    `}
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
}