"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { ComingSoonPlaceholder } from '@/components/shared/ComingSoonPlaceholder';

export default function SuperAdminBrandingPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">
          Branding & White Label
        </h1>
        <p className="text-xs text-slate-muted">Customize tenant branding</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-line shadow-card">
        <ComingSoonPlaceholder
          icon={<Palette className="w-7 h-7" />}
          title="Managed Per Tenant, Not Here"
          description="Each store's brand color and logo are configured by that store's own Admin, from their Store Configuration page — not by SuperAdmin. Open a store under Tenant Management to view its current branding."
        />
      </div>
    </div>
  );
}
