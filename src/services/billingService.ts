import { apiClient } from '@/lib/apiClient';

export type Purity = '9K' | '14K' | '18K' | '20K' | '22K' | '24K';
export const PURITY_OPTIONS: Purity[] = ['9K', '14K', '18K', '20K', '22K', '24K'];

export type ChargeType = 'FIXED' | 'PER_GRAM' | 'PERCENTAGE';
export const CHARGE_TYPE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: 'PERCENTAGE', label: '% of gold value' },
  { value: 'PER_GRAM', label: 'Per gram' },
  { value: 'FIXED', label: 'Fixed amount' },
];

export type StockStatus = 'IN_STOCK' | 'SOLD' | 'INACTIVE';

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
  vendor_name: string | null;
  purchase_date: string | null;
  purchase_invoice_ref: string | null;
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
  vendorName: string | null;
  purchaseDate: string | null;
  purchaseInvoiceRef: string | null;
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
  vendorName?: string;
  purchaseDate?: string;
  purchaseInvoiceRef?: string;
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
    vendorName: raw.vendor_name,
    purchaseDate: raw.purchase_date,
    purchaseInvoiceRef: raw.purchase_invoice_ref,
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
    vendor_name: data.vendorName || null,
    purchase_date: data.purchaseDate || null,
    purchase_invoice_ref: data.purchaseInvoiceRef || null,
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
  huid: string | null;
  gross_weight_grams: number;
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
  huid: string | null;
  grossWeightGrams: number;
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
    huid: raw.huid,
    grossWeightGrams: raw.gross_weight_grams,
    purchaseCostSnapshot: raw.purchase_cost_snapshot,
    estimatedGrossMargin: raw.estimated_gross_margin,
    saleTimestamp: raw.sale_timestamp,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
  };
}

export const billingService = {
  /* Inventory */
  async listInventory(params: {
    page?: number;
    limit?: number;
    search?: string;
    stockStatus?: StockStatus;
    category?: string;
  } = {}): Promise<{ items: InventoryItem[]; total: number }> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.search) query.set('search', params.search);
    if (params.stockStatus) query.set('stock_status', params.stockStatus);
    if (params.category) query.set('category', params.category);

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
