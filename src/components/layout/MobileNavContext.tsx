"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface MobileNavContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue | undefined>(undefined);

// Shared open/close state for the mobile sidebar drawer used by
// AdminSidebar/SuperAdminSidebar (the drawer itself) and TopBar (the
// hamburger trigger) — both need the same state, so it's lifted into one
// small context per workspace layout rather than duplicated.
export const MobileNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close on navigation so the drawer never stays open behind a new page.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <MobileNavContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
};

export function useMobileNav(): MobileNavContextValue {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error('useMobileNav must be used within a MobileNavProvider');
  }
  return ctx;
}
