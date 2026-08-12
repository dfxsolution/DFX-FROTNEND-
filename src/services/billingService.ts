import { apiClient, API_BASE_URL, tokenStore } from '@/lib/apiClient';

export type Purity = '9K' | '14K' | '18K' | '20K' | '22K' | '24K';
export const PURITY_OPTIONS: Purity[] = ['9K', '14K', '18K', '20K', '22K', '24K'];

export type ChargeType = 'FIXED' | 'PER_GRAM' | 'PERCENTAGE';
export const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: 'PERCENTAGE', label: '% of gold value' },
  { value: 'PER_GRAM', label: 'Per gram' },
  { value: 'FIXED', label: 'Fixed amount' },
];

export type StockStatus = 'IN_STOCK' | 'SOLD' | 'INACTIVE';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'OTHER'];
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';
export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PAID', 'PENDING', 'PARTIAL'];

/* ------------------------------------------------------------------ */
/* Vendor                                                              */
/* ------------------------------------------------------------------ */

interface BackendVendor {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  isActive: boolean;
}

export interface VendorFormData {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

function mapVendor(raw: BackendVendor): Vendor {
  return {
    id: raw.id,
    name: raw.name,
    contactPerson: raw.contact_person,
    phone: raw.phone,
    email: raw.email,
    address: raw.address,
    gstNumber: raw.gst_number,
    isActive: raw.is_active,
  };
}

/* ------------------------------------------------------------------ */
/* Inventory / Product Master                                         */
/* ------------------------------------------------------------------ */

interface BackendInventoryItem {
  id: string;
  tenant_id: string;
  product_code: string;
  product_name: string;
  category: string | null;
  subcategory: string | null;
  huid: string | null;
  purity: string;
  gross_weight_grams: number;
  net_gold_weight_grams: number;
  vendor_id: string | null;
  vendor_name: string | null;
  purchase_date: string | null;
  purchase_invoice_ref: string | null;
  purchase_rate_per_gram: number | null;
  purchase_cost: number | null;
  image_url: string | null;
  stock_status: StockStatus;
  making_charge_type: ChargeType;
  making_charge_value: number;
  wastage_type: ChargeType;
  wastage_value: number;
  stone_charge_amount: number;
  other_charges_amount: number;
  tax_rate_percent: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  productCode: string;
  productName: string;
  category: string | null;
  subcategory: string | null;
  huid: string | null;
  purity: Purity;
  grossWeightGrams: number;
  netGoldWeightGrams: number;
  vendorId: string | null;
  vendorName: string | null;
  purchaseDate: string | null;
  purchaseInvoiceRef: string | null;
  purchaseRatePerGram: number | null;
  purchaseCost: number | null;
  imageUrl: string | null;
  stockStatus: StockStatus;
  makingChargeType: ChargeType;
  makingChargeValue: number;
  wastageType: ChargeType;
  wastageValue: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemFormData {
  productCode: string;
  productName: string;
  category?: string;
  subcategory?: string;
  huid?: string;
  purity: Purity;
  grossWeightGrams: number;
  netGoldWeightGrams: number;
  vendorId?: string;
  vendorName?: string;
  purchaseDate?: string;
  purchaseInvoiceRef?: string;
  purchaseRatePerGram?: number;
  purchaseCost?: number;
  makingChargeType: ChargeType;
  makingChargeValue: number;
  wastageType: ChargeType;
  wastageValue: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
}

function mapInventoryItem(raw: BackendInventoryItem): InventoryItem {
  return {
    id: raw.id,
    productCode: raw.product_code,
    productName: raw.product_name,
    category: raw.category,
    subcategory: raw.subcategory,
    huid: raw.huid,
    purity: raw.purity as Purity,
    grossWeightGrams: raw.gross_weight_grams,
    netGoldWeightGrams: raw.net_gold_weight_grams,
    vendorId: raw.vendor_id,
    vendorName: raw.vendor_name,
    purchaseDate: raw.purchase_date,
    purchaseInvoiceRef: raw.purchase_invoice_ref,
    purchaseRatePerGram: raw.purchase_rate_per_gram,
    purchaseCost: raw.purchase_cost,
    imageUrl: raw.image_url,
    stockStatus: raw.stock_status,
    makingChargeType: raw.making_charge_type,
    makingChargeValue: raw.making_charge_value,
    wastageType: raw.wastage_type,
    wastageValue: raw.wastage_value,
    stoneChargeAmount: raw.stone_charge_amount,
    otherChargesAmount: raw.other_charges_amount,
    taxRatePercent: raw.tax_rate_percent,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function toBackendInventoryPayload(data: Partial<InventoryItemFormData>) {
  return {
    product_code: data.productCode,
    product_name: data.productName,
    category: data.category || null,
    subcategory: data.subcategory || null,
    huid: data.huid || null,
    purity: data.purity,
    gross_weight_grams: data.grossWeightGrams,
    net_gold_weight_grams: data.netGoldWeightGrams,
    vendor_id: data.vendorId || null,
    vendor_name: data.vendorName || null,
    purchase_date: data.purchaseDate || null,
    purchase_invoice_ref: data.purchaseInvoiceRef || null,
    purchase_rate_per_gram: data.purchaseRatePerGram ?? null,
    purchase_cost: data.purchaseCost ?? null,
    making_charge_type: data.makingChargeType,
    making_charge_value: data.makingChargeValue,
    wastage_type: data.wastageType,
    wastage_value: data.wastageValue,
    stone_charge_amount: data.stoneChargeAmount,
    other_charges_amount: data.otherChargesAmount,
    tax_rate_percent: data.taxRatePercent,
  };
}

/* ------------------------------------------------------------------ */
/* Selling / Sale                                                      */
/* ------------------------------------------------------------------ */

export interface PriceBreakdown {
  purity: Purity;
  netGoldWeightGrams: number;
  goldRate24k: number;
  goldRatePurityFactor: number;
  goldRateApplied: number;
  goldRateSource: string;
  goldRateEffectiveDate: string;
  goldValueAmount: number;
  makingChargeType: ChargeType;
  makingChargeValue: number;
  makingChargeAmount: number;
  wastageType: ChargeType;
  wastageValue: number;
  wastageAmount: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  subtotalBeforeTax: number;
  taxRatePercent: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
}

interface BackendPriceBreakdown {
  purity: string;
  net_gold_weight_grams: number;
  gold_rate_24k: number;
  gold_rate_purity_factor: number;
  gold_rate_applied: number;
  gold_rate_source: string;
  gold_rate_effective_date: string;
  gold_value_amount: number;
  making_charge_type: ChargeType;
  making_charge_value: number;
  making_charge_amount: number;
  wastage_type: ChargeType;
  wastage_value: number;
  wastage_amount: number;
  stone_charge_amount: number;
  other_charges_amount: number;
  subtotal_before_tax: number;
  tax_rate_percent: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
}

function mapBreakdown(raw: BackendPriceBreakdown): PriceBreakdown {
  return {
    purity: raw.purity as Purity,
    netGoldWeightGrams: raw.net_gold_weight_grams,
    goldRate24k: raw.gold_rate_24k,
    goldRatePurityFactor: raw.gold_rate_purity_factor,
    goldRateApplied: raw.gold_rate_applied,
    goldRateSource: raw.gold_rate_source,
    goldRateEffectiveDate: raw.gold_rate_effective_date,
    goldValueAmount: raw.gold_value_amount,
    makingChargeType: raw.making_charge_type,
    makingChargeValue: raw.making_charge_value,
    makingChargeAmount: raw.making_charge_amount,
    wastageType: raw.wastage_type,
    wastageValue: raw.wastage_value,
    wastageAmount: raw.wastage_amount,
    stoneChargeAmount: raw.stone_charge_amount,
    otherChargesAmount: raw.other_charges_amount,
    subtotalBeforeTax: raw.subtotal_before_tax,
    taxRatePercent: raw.tax_rate_percent,
    taxAmount: raw.tax_amount,
    discountAmount: raw.discount_amount,
    finalAmount: raw.final_amount,
  };
}

export interface SaleQuote {
  inventoryItem: InventoryItem;
  breakdown: PriceBreakdown;
}

export interface SaleCreateData {
  productCode: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  discountAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
}

interface BackendSale extends BackendPriceBreakdown {
  id: string;
  tenant_id: string;
  invoice_number: string;
  inventory_item_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  product_code: string;
  product_name: string;
  vendor_name: string | null;
  huid: string | null;
  gross_weight_grams: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  purchase_cost_snapshot: number | null;
  estimated_gross_margin: number | null;
  sale_timestamp: string;
  created_by: string;
  created_at: string;
}

export interface Sale extends PriceBreakdown {
  id: string;
  invoiceNumber: string;
  inventoryItemId: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  productCode: string;
  productName: string;
  vendorName: string | null;
  huid: string | null;
  grossWeightGrams: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  purchaseCostSnapshot: number | null;
  estimatedGrossMargin: number | null;
  saleTimestamp: string;
  createdBy: string;
  createdAt: string;
}

function mapSale(raw: BackendSale): Sale {
  return {
    ...mapBreakdown(raw),
    id: raw.id,
    invoiceNumber: raw.invoice_number,
    inventoryItemId: raw.inventory_item_id,
    customerId: raw.customer_id,
    customerName: raw.customer_name,
    customerPhone: raw.customer_phone,
    productCode: raw.product_code,
    productName: raw.product_name,
    vendorName: raw.vendor_name,
    huid: raw.huid,
    grossWeightGrams: raw.gross_weight_grams,
    paymentMethod: raw.payment_method,
    paymentStatus: raw.payment_status,
    purchaseCostSnapshot: raw.purchase_cost_snapshot,
    estimatedGrossMargin: raw.estimated_gross_margin,
    saleTimestamp: raw.sale_timestamp,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
  };
}

export interface BulkPurchaseLineItem {
  productCode: string;
  productName: string;
  category?: string;
  subcategory?: string;
  huid?: string;
  purity: Purity;
  grossWeightGrams: number;
  netGoldWeightGrams: number;
  purchaseRatePerGram?: number;
  purchaseCost?: number;
  makingChargeType: ChargeType;
  makingChargeValue: number;
  wastageType: ChargeType;
  wastageValue: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
}

export interface BulkPurchaseData {
  vendorId: string;
  purchaseDate: string;
  purchaseInvoiceRef?: string;
  items: BulkPurchaseLineItem[];
}

function toBackendLineItem(i: BulkPurchaseLineItem) {
  return {
    product_code: i.productCode,
    product_name: i.productName,
    category: i.category || null,
    subcategory: i.subcategory || null,
    huid: i.huid || null,
    purity: i.purity,
    gross_weight_grams: i.grossWeightGrams,
    net_gold_weight_grams: i.netGoldWeightGrams,
    purchase_rate_per_gram: i.purchaseRatePerGram ?? null,
    purchase_cost: i.purchaseCost ?? null,
    making_charge_type: i.makingChargeType,
    making_charge_value: i.makingChargeValue,
    wastage_type: i.wastageType,
    wastage_value: i.wastageValue,
    stone_charge_amount: i.stoneChargeAmount,
    other_charges_amount: i.otherChargesAmount,
    tax_rate_percent: i.taxRatePercent,
  };
}

async function downloadBlob(path: string, filename: string): Promise<void> {
  const token = tokenStore.getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const billingService = {
  /* Vendors */
  async listVendors(search?: string): Promise<Vendor[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiClient.get<{ vendors: BackendVendor[] }>(`/billing/vendors${query}`, { auth: true });
    return res.data.vendors.map(mapVendor);
  },

  async createVendor(data: VendorFormData): Promise<Vendor> {
    const res = await apiClient.post<{ vendor: BackendVendor }>(
      '/billing/vendors',
      {
        name: data.name,
        contact_person: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        gst_number: data.gstNumber || null,
      },
      { auth: true }
    );
    return mapVendor(res.data.vendor);
  },

  async setVendorActive(vendorId: string, isActive: boolean): Promise<Vendor> {
    const res = await apiClient.put<{ vendor: BackendVendor }>(
      `/billing/vendors/${vendorId}`,
      { is_active: isActive },
      { auth: true }
    );
    return mapVendor(res.data.vendor);
  },

  /* Bulk Purchase */
  async bulkPurchase(data: BulkPurchaseData): Promise<InventoryItem[]> {
    const res = await apiClient.post<{ items: BackendInventoryItem[] }>(
      '/billing/inventory/bulk-purchase',
      {
        vendor_id: data.vendorId,
        purchase_date: data.purchaseDate,
        purchase_invoice_ref: data.purchaseInvoiceRef || null,
        items: data.items.map(toBackendLineItem),
      },
      { auth: true }
    );
    return res.data.items.map(mapInventoryItem);
  },

  /* Invoice export */
  async downloadInvoicePdf(saleId: string, invoiceNumber: string): Promise<void> {
    await downloadBlob(`/billing/sales/${saleId}/invoice.pdf`, `${invoiceNumber}.pdf`);
  },

  async downloadInvoiceExcel(saleId: string, invoiceNumber: string): Promise<void> {
    await downloadBlob(`/billing/sales/${saleId}/invoice.xlsx`, `${invoiceNumber}.xlsx`);
  },

  /* Inventory */
  async listInventory(params: {
    page?: number;
    limit?: number;
    search?: string;
    stockStatus?: StockStatus;
    category?: string;
    vendorId?: string;
  } = {}): Promise<{ items: InventoryItem[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.search) query.set('search', params.search);
    if (params.stockStatus) query.set('stock_status', params.stockStatus);
    if (params.category) query.set('category', params.category);
    if (params.vendorId) query.set('vendor_id', params.vendorId);

    const res = await apiClient.get<{ items: BackendInventoryItem[]; total: number }>(
      `/billing/inventory?${query.toString()}`,
      { auth: true }
    );
    return { items: res.data.items.map(mapInventoryItem), total: res.data.total };
  },

  async getInventoryItem(itemId: string): Promise<InventoryItem> {
    const res = await apiClient.get<{ item: BackendInventoryItem }>(`/billing/inventory/${itemId}`, { auth: true });
    return mapInventoryItem(res.data.item);
  },

  async createInventoryItem(data: InventoryItemFormData): Promise<InventoryItem> {
    const res = await apiClient.post<{ item: BackendInventoryItem }>(
      '/billing/inventory',
      toBackendInventoryPayload(data),
      { auth: true }
    );
    return mapInventoryItem(res.data.item);
  },

  async updateInventoryItem(itemId: string, data: Partial<InventoryItemFormData>): Promise<InventoryItem> {
    const res = await apiClient.put<{ item: BackendInventoryItem }>(
      `/billing/inventory/${itemId}`,
      toBackendInventoryPayload(data),
      { auth: true }
    );
    return mapInventoryItem(res.data.item);
  },

  async setInventoryItemStatus(itemId: string, stockStatus: 'IN_STOCK' | 'INACTIVE'): Promise<InventoryItem> {
    const res = await apiClient.put<{ item: BackendInventoryItem }>(
      `/billing/inventory/${itemId}`,
      { stock_status: stockStatus },
      { auth: true }
    );
    return mapInventoryItem(res.data.item);
  },

  async uploadInventoryItemImage(itemId: string, file: File): Promise<InventoryItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{ item: BackendInventoryItem }>(
      `/billing/inventory/${itemId}/image`,
      formData,
      { auth: true }
    );
    return mapInventoryItem(res.data.item);
  },

  /* Selling */
  async getSaleQuote(productCode: string, discountAmount = 0): Promise<SaleQuote> {
    const query = new URLSearchParams({ discount_amount: String(discountAmount) });
    const res = await apiClient.get<{ inventory_item: BackendInventoryItem; breakdown: BackendPriceBreakdown }>(
      `/billing/sell/quote/${encodeURIComponent(productCode)}?${query.toString()}`,
      { auth: true }
    );
    return {
      inventoryItem: mapInventoryItem(res.data.inventory_item),
      breakdown: mapBreakdown(res.data.breakdown),
    };
  },

  async createSale(data: SaleCreateData): Promise<Sale> {
    const res = await apiClient.post<{ sale: BackendSale }>(
      '/billing/sell',
      {
        product_code: data.productCode,
        customer_id: data.customerId || null,
        customer_name: data.customerName || null,
        customer_phone: data.customerPhone || null,
        discount_amount: data.discountAmount ?? 0,
        payment_method: data.paymentMethod ?? 'CASH',
        payment_status: data.paymentStatus ?? 'PAID',
      },
      { auth: true }
    );
    return mapSale(res.data.sale);
  },

  /* Sales History */
  async listSales(params: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<{ sales: Sale[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.search) query.set('search', params.search);
    if (params.dateFrom) query.set('date_from', params.dateFrom);
    if (params.dateTo) query.set('date_to', params.dateTo);

    const res = await apiClient.get<{ sales: BackendSale[]; total: number }>(
      `/billing/sales?${query.toString()}`,
      { auth: true }
    );
    return { sales: res.data.sales.map(mapSale), total: res.data.total };
  },

  async getSale(saleId: string): Promise<Sale> {
    const res = await apiClient.get<{ sale: BackendSale }>(`/billing/sales/${saleId}`, { auth: true });
    return mapSale(res.data.sale);
  },
};
