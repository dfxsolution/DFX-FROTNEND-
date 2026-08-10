import React from 'react';
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';
import { RequireAuth } from '@/components/shared/RequireAuth';
import { TenantProvider } from '@/providers/TenantProvider';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth allow={['superadmin']}>
      <TenantProvider>
        <MobileNavProvider>
          <div className="flex h-screen overflow-hidden bg-[#F7F8FC]">
            <SuperAdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <TopBar />
              <main className="flex-1 p-3 sm:p-6 overflow-y-auto overflow-x-hidden">{children}</main>
            </div>
          </div>
        </MobileNavProvider>
      </TenantProvider>
    </RequireAuth>
  );
}
