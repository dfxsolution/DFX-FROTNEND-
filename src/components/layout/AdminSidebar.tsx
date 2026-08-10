"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS } from '@/constants';
import { useTenant } from '@/hooks/useTenant';
import { useAuth } from '@/hooks/useAuth';
import { useMobileNav } from './MobileNavContext';
import {
  LayoutDashboard,
  Users,
  Coins,
  Gem,
  UserPlus,
  CreditCard,
  Tag,
  Calendar,
  Megaphone,
  TrendingUp,
  BarChart3,
  Store,
  UserCheck,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Coins,
  Gem,
  UserPlus,
  CreditCard,
  Tag,
  Calendar,
  Megaphone,
  TrendingUp,
  BarChart3,
  Store,
  UserCheck,
  ShieldCheck,
  Settings,
  LifeBuoy,
  Bell,
};

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { branding } = useTenant();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, close } = useMobileNav();

  // Staff only sees modules explicitly granted to their account — Admin/
  // SuperAdmin (and the Customer role, which never reaches this sidebar)
  // always see everything, matching the backend's require_admin_or_staff_module.
  const isStaff = user?.backendRole === 'Staff';
  const visibleItems = isStaff
    ? ADMIN_NAV_ITEMS.filter((item) => item.staffModule && user!.permissions.includes(item.staffModule))
    : ADMIN_NAV_ITEMS;

  return (
    <>
      {/* Mobile backdrop — only rendered/interactive while the drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside className={cn(
        "shrink-0 bg-gradient-to-b from-ink to-ink-2 text-[#E8EAF6] min-h-screen flex flex-col border-r border-[#232B4A] transition-transform lg:transition-[width] duration-300",
        "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "w-64 lg:w-20" : "w-64"
      )}>
      <div className="p-5 border-b border-[#232B4A] flex items-center justify-between lg:justify-center min-h-[60px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full border border-gold flex items-center justify-center font-display font-bold text-gold-light text-sm bg-radial from-ink-2 to-ink shrink-0">
            {branding.logoText || 'DF'}
          </div>
          {(!collapsed || isOpen) && (
            <div className="animate-in fade-in whitespace-nowrap lg:block">
              <div className="font-display font-bold text-sm text-white leading-none">
                {branding.brandName}
              </div>
              <div className="text-[11px] text-[#9AA3C7] mt-1">Jeweller Admin</div>
            </div>
          )}
        </div>
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg text-[#9AA3C7] hover:text-white hover:bg-[#1E2A52]/50"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {(!collapsed || isOpen) && (
          <div className="px-5 text-[10px] uppercase tracking-wider text-[#9AA3C7] font-bold mb-2">
            Management
          </div>
        )}
        {visibleItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            item.path === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.path);
          const showLabel = !collapsed || isOpen;

          return (
            <Link
              key={item.key}
              href={item.path}
              onClick={close}
              className={cn(
                "w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold transition-all border-l-4",
                isActive
                  ? "bg-[#1E2A52] text-white border-gold"
                  : "text-[#C7CDE8] border-transparent hover:bg-[#1E2A52]/50 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3" title={!showLabel ? item.label : undefined}>
                <Icon className="h-5 w-5 shrink-0" />
                {showLabel && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
              {!item.ready && showLabel && (
                <span className="text-[9px] font-mono text-[#9AA3C7] bg-[#182142] px-1.5 py-0.5 rounded">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#232B4A] hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[#9AA3C7] hover:text-white hover:bg-[#1E2A52]/50 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      </aside>
    </>
  );
};
