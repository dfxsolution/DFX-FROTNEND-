import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { billingService, Sale } from '@/services/billingService';
import { printInvoice } from './printInvoice';

/** PDF/Excel/Print trio for a finalized Sale — shared by the Sell screen's
 * success step and Sales History's detail dialog so the two don't drift. */
export function InvoiceActions({ sale, businessName, size = 'sm' }: { sale: Sale; businessName: string; size?: 'sm' | 'default' }) {
  return (
    <>
      <Button variant="outline" size={size} onClick={() => billingService.downloadInvoicePdf(sale.id, sale.invoiceNumber)}>
        <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
      </Button>
      <Button variant="outline" size={size} onClick={() => billingService.downloadInvoiceExcel(sale.id, sale.invoiceNumber)}>
        <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Excel
      </Button>
      <Button variant="outline" size={size} onClick={() => printInvoice(sale, businessName)}>
        <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
      </Button>
    </>
  );
}
