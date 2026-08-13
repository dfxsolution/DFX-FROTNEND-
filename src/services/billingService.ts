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

export type PricingMode = 'AUTO' | 'HYBRID' | 'MANUAL';
export const PRICING_MODE_OPTIONS: { value: PricingMode; label: string }[] = [
  { value: 'AUTO', label: 'Auto — system calculates' },
  { value: 'HYBRID', label: 'Hybrid — suggested, editable' },
  { value: 'MANUAL', label: 'Manual — you set the price' },
];
export type DefaultSource = 'VENDOR' | 'CATEGORY' | 'STORE' | 'NONE';

/* ------------------------------------------------------------------ */
/* Shared default-fields shape — Vendor / Category / Store defaults    */
/* all carry exactly this set (pre-fill only, never linked from a      */
/* saved InventoryItem/Sale).                                          */
/* ------------------------------------------------------------------ */

interface BackendBillingDefaultFields {
  making_charge_type: ChargeType | null;
  making_charge_value: number | null;
  wastage_type: ChargeType | null;
  wastage_value: number | null;
  gold_profit_percent: number | null;
  tax_rate_percent: number | null;
  default_pricing_mode: PricingMode | null;
}

export interface BillingDefaultFields {
  makingChargeType: ChargeType | null;
  makingChargeValue: number | null;
  wastageType: ChargeType | null;
  wastageValue: number | null;
  goldProfitPercent: number | null;
  taxRatePercent: number | null;
  defaultPricingMode: PricingMode | null;
}

function mapDefaultFields(raw: BackendBillingDefaultFields): BillingDefaultFields {
  return {
    makingChargeType: raw.making_charge_type,
    makingChargeValue: raw.making_charge_value,
    wastageType: raw.wastage_type,
    wastageValue: raw.wastage_value,
    goldProfitPercent: raw.gold_profit_percent,
    taxRatePercent: raw.tax_rate_percent,
    defaultPricingMode: raw.default_pricing_mode,
  };
}

function toBackendDefaultFields(data: Partial<BillingDefaultFields>) {
  return {
    making_charge_type: data.makingChargeType ?? null,
    making_charge_value: data.makingChargeValue ?? null,
    wastage_type: data.wastageType ?? null,
    wastage_value: data.wastageValue ?? null,
    gold_profit_percent: data.goldProfitPercent ?? null,
    tax_rate_percent: data.taxRatePercent ?? null,
    default_pricing_mode: data.defaultPricingMode ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Vendor                                                              */
/* ------------------------------------------------------------------ */

interface BackendVendor extends BackendBillingDefaultFields {
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

export interface Vendor extends BillingDefaultFields {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  isActive: boolean;
}

export interface VendorFormData extends Partial<BillingDefaultFields> {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

function mapVendor(raw: BackendVendor): Vendor {
  return {
    ...mapDefaultFields(raw),
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
/* Category Pricing Default                                            */
/* ------------------------------------------------------------------ */

interface BackendCategoryDefault extends BackendBillingDefaultFields {
  id: string;
  category: string;
  created_at: string;
}

export interface CategoryDefault extends BillingDefaultFields {
  id: string;
  category: string;
}

function mapCategoryDefault(raw: BackendCategoryDefault): CategoryDefault {
  return { ...mapDefaultFields(raw), id: raw.id, category: raw.category };
}

/* ------------------------------------------------------------------ */
/* Store (Tenant) Billing Defaults                                     */
/* ------------------------------------------------------------------ */

export type StoreDefaults = BillingDefaultFields;

/* ------------------------------------------------------------------ */
/* Resolved Defaults — field-by-field, for pre-filling forms           */
/* ------------------------------------------------------------------ */

interface BackendResolvedDefaults {
  making_charge_type: ChargeType | null;
  making_charge_value: number | null;
  wastage_type: ChargeType | null;
  wastage_value: number | null;
  gold_profit_percent: number | null;
  tax_rate_percent: number | null;
  pricing_mode: PricingMode | null;
  sources: Record<string, DefaultSource>;
}

export interface ResolvedDefaults {
  makingChargeType: ChargeType | null;
  makingChargeValue: number | null;
  wastageType: ChargeType | null;
  wastageValue: number | null;
  goldProfitPercent: number | null;
  taxRatePercent: number | null;
  pricingMode: PricingMode | null;
  sources: Record<string, DefaultSource>;
}

function mapResolvedDefaults(raw: BackendResolvedDefaults): ResolvedDefaults {
  return {
    makingChargeType: raw.making_charge_type,
    makingChargeValue: raw.making_charge_value,
    wastageType: raw.wastage_type,
    wastageValue: raw.wastage_value,
    goldProfitPercent: raw.gold_profit_percent,
    taxRatePercent: raw.tax_rate_percent,
    pricingMode: raw.pricing_mode,
    sources: raw.sources,
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
  gold_profit_percent: number;
  stone_charge_amount: number;
  other_charges_amount: number;
  tax_rate_percent: number;
  pricing_mode: PricingMode | null;
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
  goldProfitPercent: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
  pricingMode: PricingMode | null;
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
  goldProfitPercent: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
  pricingMode?: PricingMode | null;
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
    goldProfitPercent: raw.gold_profit_percent,
    stoneChargeAmount: raw.stone_charge_amount,
    otherChargesAmount: raw.other_charges_amount,
    taxRatePercent: raw.tax_rate_percent,
    pricingMode: raw.pricing_mode,
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
    gold_profit_percent: data.goldProfitPercent,
    stone_charge_amount: data.stoneChargeAmount,
    other_charges_amount: data.otherChargesAmount,
    tax_rate_percent: data.taxRatePercent,
    pricing_mode: data.pricingMode ?? null,
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
  goldProfitPercent: number;
  goldProfitAmount: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  subtotalBeforeTax: number;
  gstApplied: boolean;
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
  gold_profit_percent: number;
  gold_profit_amount: number;
  stone_charge_amount: number;
  other_charges_amount: number;
  subtotal_before_tax: number;
  gst_applied: boolean;
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
    goldProfitPercent: raw.gold_profit_percent,
    goldProfitAmount: raw.gold_profit_amount,
    stoneChargeAmount: raw.stone_charge_amount,
    otherChargesAmount: raw.other_charges_amount,
    subtotalBeforeTax: raw.subtotal_before_tax,
    gstApplied: raw.gst_applied,
    taxRatePercent: raw.tax_rate_percent,
    taxAmount: raw.tax_amount,
    discountAmount: raw.discount_amount,
    finalAmount: raw.final_amount,
  };
}

export interface SaleQuote {
  inventoryItem: InventoryItem;
  breakdown: PriceBreakdown;
  profitOrLoss: number | null;
}

export interface SaleCreateData {
  productCode: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  discountAmount?: number;
  customerPrice?: number;
  gstApplied?: boolean;
  pricingMode?: PricingMode;
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
  pricing_mode: PricingMode | null;
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
  pricingMode: PricingMode | null;
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
    pricingMode: raw.pricing_mode,
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
  goldProfitPercent: number;
  stoneChargeAmount: number;
  otherChargesAmount: number;
  taxRatePercent: number;
  pricingMode?: PricingMode | null;
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
    gold_profit_percent: i.goldProfitPercent,
    stone_charge_amount: i.stoneChargeAmount,
    other_charges_amount: i.otherChargesAmount,
    tax_rate_percent: i.taxRatePercent,
    pricing_mode: i.pricingMode ?? null,
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

/* ------------------------------------------------------------------ */
/* Dashboard Billing Summary                                          */
/* ------------------------------------------------------------------ */

export interface BillingPeriodSummary {
  totalSales: number;
  totalProfit: number | null;
  totalLoss: number | null;
  billCount: number;
  itemsSold: number;
  totalTax: number;
  avgBillValue: number;
}

export type BusinessHistoryPeriod =
  | 'today' | 'yesterday' | 'this_week' | 'last_week'
  | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_12_months';

export interface RecentSale {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  productCode: string;
  productName: string;
  finalAmount: number;
  profitOrLoss: number | null;
  saleTimestamp: string;
}

export interface BillingDashboardSummary {
  today: BillingPeriodSummary;
  thisMonth: BillingPeriodSummary;
  todayGoldRate24k: number | null;
  recentSales: RecentSale[];
  selectedPeriod: BillingPeriodSummary;
  selectedPeriodLabel: string;
  selectedDateFrom: string;
  selectedDateTo: string;
}

interface BackendBillingPeriodSummary {
  total_sales: number;
  total_profit: number | null;
  total_loss: number | null;
  bill_count: number;
  items_sold: number;
  total_tax: number;
  avg_bill_value: number;
}

interface BackendRecentSale {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  product_code: string;
  product_name: string;
  final_amount: number;
  profit_or_loss: number | null;
  sale_timestamp: string;
}

interface BackendBillingDashboardSummary {
  today: BackendBillingPeriodSummary;
  this_month: BackendBillingPeriodSummary;
  today_gold_rate_24k: number | null;
  recent_sales: BackendRecentSale[];
  selected_period: BackendBillingPeriodSummary;
  selected_period_label: string;
  selected_date_from: string;
  selected_date_to: string;
}

function mapPeriodSummary(raw: BackendBillingPeriodSummary): BillingPeriodSummary {
  return {
    totalSales: raw.total_sales,
    totalProfit: raw.total_profit,
    totalLoss: raw.total_loss,
    billCount: raw.bill_count,
    itemsSold: raw.items_sold,
    totalTax: raw.total_tax,
    avgBillValue: raw.avg_bill_value,
  };
}

function mapDashboardSummary(raw: BackendBillingDashboardSummary): BillingDashboardSummary {
  return {
    today: mapPeriodSummary(raw.today),
    thisMonth: mapPeriodSummary(raw.this_month),
    todayGoldRate24k: raw.today_gold_rate_24k,
    selectedPeriod: mapPeriodSummary(raw.selected_period),
    selectedPeriodLabel: raw.selected_period_label,
    selectedDateFrom: raw.selected_date_from,
    selectedDateTo: raw.selected_date_to,
    recentSales: raw.recent_sales.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoice_number,
      customerName: s.customer_name,
      productCode: s.product_code,
      productName: s.product_name,
      finalAmount: s.final_amount,
      profitOrLoss: s.profit_or_loss,
      saleTimestamp: s.sale_timestamp,
    })),
  };
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
        ...toBackendDefaultFields(data),
      },
      { auth: true }
    );
    return mapVendor(res.data.vendor);
  },

  async updateVendor(vendorId: string, data: Partial<VendorFormData> & { isActive?: boolean }): Promise<Vendor> {
    const res = await apiClient.put<{ vendor: BackendVendor }>(
      `/billing/vendors/${vendorId}`,
      {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contactPerson !== undefined ? { contact_person: data.contactPerson || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.gstNumber !== undefined ? { gst_number: data.gstNumber || null } : {}),
        ...(data.isActive !== undefined ? { is_active: data.isActive } : {}),
        ...toBackendDefaultFields(data),
      },
      { auth: true }
    );
    return mapVendor(res.data.vendor);
  },

  async setVendorActive(vendorId: string, isActive: boolean): Promise<Vendor> {
    return billingService.updateVendor(vendorId, { isActive });
  },

  /* Billing Defaults — Store / Category / Resolver */
  async getStoreDefaults(): Promise<StoreDefaults> {
    const res = await apiClient.get<BackendBillingDefaultFields>('/billing/defaults/store', { auth: true });
    return mapDefaultFields(res.data);
  },

  async updateStoreDefaults(data: Partial<BillingDefaultFields>): Promise<StoreDefaults> {
    const res = await apiClient.put<BackendBillingDefaultFields>(
      '/billing/defaults/store', toBackendDefaultFields(data), { auth: true }
    );
    return mapDefaultFields(res.data);
  },

  async listCategoryDefaults(): Promise<CategoryDefault[]> {
    const res = await apiClient.get<{ categories: BackendCategoryDefault[] }>('/billing/defaults/categories', { auth: true });
    return res.data.categories.map(mapCategoryDefault);
  },

  async upsertCategoryDefault(category: string, data: Partial<BillingDefaultFields>): Promise<CategoryDefault> {
    const res = await apiClient.put<BackendCategoryDefault>(
      '/billing/defaults/categories', { category, ...toBackendDefaultFields(data) }, { auth: true }
    );
    return mapCategoryDefault(res.data);
  },

  async resolveDefaults(vendorId?: string, category?: string): Promise<ResolvedDefaults> {
    const query = new URLSearchParams();
    if (vendorId) query.set('vendor_id', vendorId);
    if (category) query.set('category', category);
    const res = await apiClient.get<BackendResolvedDefaults>(`/billing/defaults/resolve?${query.toString()}`, { auth: true });
    return mapResolvedDefaults(res.data);
  },

  /* Live price preview for an unsaved bulk-entry row */
  async previewPrice(input: {
    purity: Purity;
    netGoldWeightGrams: number;
    makingChargeType: ChargeType;
    makingChargeValue: number;
    wastageType: ChargeType;
    wastageValue: number;
    goldProfitPercent: number;
    stoneChargeAmount: number;
    otherChargesAmount: number;
    taxRatePercent: number;
    purchaseCost?: number;
    customerPrice?: number;
  }): Promise<{ breakdown: PriceBreakdown; purchaseCost: number | null; profitOrLoss: number | null }> {
    const res = await apiClient.post<{ breakdown: BackendPriceBreakdown; purchase_cost: number | null; profit_or_loss: number | null }>(
      '/billing/inventory/preview-price',
      {
        purity: input.purity,
        net_gold_weight_grams: input.netGoldWeightGrams,
        making_charge_type: input.makingChargeType,
        making_charge_value: input.makingChargeValue,
        wastage_type: input.wastageType,
        wastage_value: input.wastageValue,
        gold_profit_percent: input.goldProfitPercent,
        stone_charge_amount: input.stoneChargeAmount,
        other_charges_amount: input.otherChargesAmount,
        tax_rate_percent: input.taxRatePercent,
        gst_applied: true,
        purchase_cost: input.purchaseCost ?? null,
        customer_price: input.customerPrice ?? null,
      },
      { auth: true }
    );
    return {
      breakdown: mapBreakdown(res.data.breakdown),
      purchaseCost: res.data.purchase_cost,
      profitOrLoss: res.data.profit_or_loss,
    };
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
  async getSaleQuote(
    productCode: string,
    discountAmount = 0,
    gstApplied = true,
    customerPrice?: number
  ): Promise<SaleQuote> {
    const query = new URLSearchParams({ discount_amount: String(discountAmount), gst_applied: String(gstApplied) });
    if (customerPrice !== undefined) query.set('customer_price', String(customerPrice));
    const res = await apiClient.get<{ inventory_item: BackendInventoryItem; breakdown: BackendPriceBreakdown; profit_or_loss: number | null }>(
      `/billing/sell/quote/${encodeURIComponent(productCode)}?${query.toString()}`,
      { auth: true }
    );
    return {
      inventoryItem: mapInventoryItem(res.data.inventory_item),
      breakdown: mapBreakdown(res.data.breakdown),
      profitOrLoss: res.data.profit_or_loss,
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
        customer_price: data.customerPrice ?? null,
        gst_applied: data.gstApplied ?? true,
        pricing_mode: data.pricingMode ?? null,
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

  /* Dashboard */
  async getDashboardSummary(period?: BusinessHistoryPeriod): Promise<BillingDashboardSummary> {
    const query = period ? `?period=${period}` : '';
    const res = await apiClient.get<BackendBillingDashboardSummary>(`/billing/dashboard-summary${query}`, { auth: true });
    return mapDashboardSummary(res.data);
  },
};
