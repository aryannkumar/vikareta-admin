'use client';

import { useState } from 'react';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  adminUser: any;
  onLogout: () => void;
}

export default function Header({ adminUser, onLogout }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {adminUser?.firstName} {adminUser?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {adminUser?.role}
                  </div>
                </div>
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div className="font-medium">{adminUser?.firstName} {adminUser?.lastName}</div>
                  <div className="text-xs text-gray-500">{adminUser?.email}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Handle profile view
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    // Handle settings
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                <div className="border-t border-gray-200"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}