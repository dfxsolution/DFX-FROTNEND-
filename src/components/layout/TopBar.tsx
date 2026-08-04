"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { Search, Bell, Settings, LogOut, Building2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const TopBar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { branding } = useTenant();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left side: Company Context */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark border border-gold/30">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-[#0B0E23] leading-none">{branding.brandName}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider flex items-center gap-1">
            <Store className="w-3 h-3 text-gold" />
            <span>{isSuperAdmin ? 'Platform-Wide' : 'Admin Workspace'}</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search customers, scheme passbooks, payments..." 
            className="w-full pl-9 bg-[#F7F8FC] border-slate-200 h-9 text-xs focus:border-gold focus:ring-gold/20 font-medium"
          />
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push(isSuperAdmin ? '/superadmin/audit' : '/admin/appointments')} 
          className="relative p-2 text-slate-400 hover:text-[#0B0E23] transition-colors rounded-xl hover:bg-slate-100"
          title="Notifications & Bookings"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full border border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-0.5"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-[#0B0E23] leading-none">{user?.name || 'User'}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0B0E23] text-gold border border-gold/40 flex items-center justify-center shadow-2xs font-display font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-1">
          <Button 
            onClick={() => router.push(isSuperAdmin ? '/superadmin/settings' : '/admin/settings')} 
            variant="outline" 
            size="sm" 
            className="h-8 px-2.5 border-slate-200 text-slate-600 hover:text-[#0B0E23] hidden lg:flex gap-1.5 text-xs font-bold"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Button>
          
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            size="sm" 
            className="h-8 px-2.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex gap-1.5 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
