"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { SUPER_ADMIN_NAV_ITEMS } from '@/constants';
import { useMobileNav } from './MobileNavContext';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Palette,
  ShieldCheck,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Building2,
  CreditCard,
  Palette,
  ShieldCheck,
  Plug,
  Settings,
};

export const SuperAdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, close } = useMobileNav();
  const showLabel = !collapsed || isOpen;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside className={cn(
        "shrink-0 bg-gradient-to-b from-[#0B0E23] via-[#0D1226] to-[#05060F] text-[#E8EAF6] min-h-screen flex flex-col border-r border-[#232B4A] transition-transform lg:transition-[width] duration-300",
        "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "w-64 lg:w-20" : "w-64"
      )}>
      {/* Logo Area — platform-level (SuperAdmin has no tenant), so this is
          always the real DFX Solution logo, never tenant branding. */}
      <div className="p-5 border-b border-[#232B4A]/60 flex items-center justify-between lg:justify-center min-h-[60px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo className={!showLabel ? 'h-8' : 'h-9'} />
          {showLabel && (
            <div className="animate-in fade-in whitespace-nowrap">
              <div className="text-[10px] text-slate-muted font-mono mt-0.5">
                Super Admin
              </div>
            </div>
          )}
        </div>
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg text-[#9AA3C7] hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {SUPER_ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive =
            item.path === '/superadmin'
              ? pathname === '/superadmin'
              : pathname.startsWith(item.path);

          return (
            <Link
              key={item.key}
              href={item.path}
              onClick={close}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                isActive
                  ? "bg-gradient-to-r from-gold-light via-gold to-gold-dark text-ink font-extrabold shadow-md"
                  : "text-[#C7CDE8] hover:bg-white/10 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3" title={!showLabel ? item.label : undefined}>
                <Icon className="h-5 w-5 shrink-0" />
                {showLabel && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
              {!item.ready && showLabel && (
                <span className="text-[9px] font-mono text-[#9AA3C7] bg-black/40 px-1.5 py-0.5 rounded">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#232B4A]/60 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[#9AA3C7] hover:text-white hover:bg-white/10 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      </aside>
    </>
  );
};
