import { Sale } from '@/services/billingService';
import { formatCurrency } from '@/lib/formatters';

/**
 * Opens a separate, minimal print window containing only the invoice — the
 * requirement is explicit that Print must not simply print the whole Admin
 * UI (sidebar/nav included). A fresh window with just this markup is the
 * smallest change that satisfies that without touching the shared layout.
 */
export function printInvoice(sale: Sale, businessName: string) {
  const rows = [
    ['Gold Value', sale.goldValueAmount],
    [`Making Charge (${sale.makingChargeType})`, sale.makingChargeAmount],
    [`Wastage (${sale.wastageType})`, sale.wastageAmount],
    ['Stone Charge', sale.stoneChargeAmount],
    ['Other Charges', sale.otherChargesAmount],
    ['Subtotal', sale.subtotalBeforeTax],
    [`Tax / GST (${sale.taxRatePercent}%)`, sale.taxAmount],
    ['Discount', -sale.discountAmount],
  ] as const;

  const html = `
    <html><head><title>${sale.invoiceNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0B0E23; max-width: 480px; margin: 0 auto; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .muted { color: #64748b; font-size: 12px; }
      table { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 13px; }
      td { padding: 4px 0; }
      .amt { text-align: right; }
      .total { font-weight: bold; font-size: 16px; border-top: 2px solid #C9A227; padding-top: 8px; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
    </style></head>
    <body>
      <h1>${businessName}</h1>
      <div class="muted">Invoice ${sale.invoiceNumber} · ${new Date(sale.saleTimestamp).toLocaleString('en-IN')}</div>
      <div class="muted">Customer: ${sale.customerName || sale.customerId || 'Walk-in'} ${sale.customerPhone || ''}</div>
      <hr />
      <div><strong>${sale.productCode} — ${sale.productName}</strong></div>
      <div class="muted">${sale.purity} · Gross ${sale.grossWeightGrams}g · Net ${sale.netGoldWeightGrams}g${sale.huid ? ' · HUID ' + sale.huid : ''}</div>
      <table>
        ${rows.map(([label, val]) => `<tr><td>${label}</td><td class="amt">${formatCurrency(val)}</td></tr>`).join('')}
        <tr class="total"><td>Final Amount</td><td class="amt">${formatCurrency(sale.finalAmount)}</td></tr>
      </table>
      <div class="muted" style="margin-top:12px;">Payment: ${sale.paymentMethod} (${sale.paymentStatus})</div>
    </body></html>
  `;

  const win = window.open('', '_blank', 'width=480,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
