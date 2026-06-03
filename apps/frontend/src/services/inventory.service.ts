import { api } from "./api";
import { buildQueryString } from "../lib/utils";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  barcode?: string;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  reorderPoint: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLevel {
  id: string;
  productId: string;
  product: Product;
  locationId: string;
  locationLabel: string;
  zone: string;
  rack: string;
  bin: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  locationId: string;
  delta: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface ProductWithStock extends Product {
  inventoryLevels: InventoryLevel[];
  totalOnHand: number;
  totalAvailable: number;
  stockStatus: "in_stock" | "low" | "critical" | "out_of_stock";
}

export interface ProductsFilters {
  search?: string;
  category?: string;
  status?: string;
  zone?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  category: string;
  barcode?: string;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  reorderPoint: number;
  initialQty: number;
  locationZone: string;
}

export interface AdjustStockPayload {
  productId: string;
  locationId: string;
  delta: number;
  reason: string;
}

export interface DashboardStats {
  totalSkus: number;
  totalSkusDelta: number;
  inventoryValue: number;
  inventoryValueDelta: number;
  pendingOrders: number;
  pendingOrdersDelta: number;
  lowStockCount: number;
  criticalCount: number;
}

export interface TrendPoint {
  date: string;
  received: number;
  shipped: number;
}

export interface ActivityItem {
  id: string;
  type: "received" | "shipped" | "alert" | "transfer" | "cycle_count";
  message: string;
  reference: string;
  location?: string;
  createdAt: string;
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  unitsMoved: number;
  sparkData: number[];
}

export interface CategoryDistribution {
  category: string;
  percentage: number;
  value: number;
}

export const inventoryService = {
  getDashboardStats: () => api.get<DashboardStats>("/dashboard/stats"),

  getStockTrend: (days = 30) =>
    api.get<TrendPoint[]>(`/dashboard/trend?days=${days}`),

  getRecentActivity: (limit = 10) =>
    api.get<ActivityItem[]>(`/dashboard/activity?limit=${limit}`),

  getTopProducts: (limit = 5) =>
    api.get<TopProduct[]>(`/dashboard/top-products?limit=${limit}`),

  getCategoryDistribution: () =>
    api.get<CategoryDistribution[]>("/dashboard/categories"),

  getProducts: (filters: ProductsFilters = {}) =>
    api.get<PaginatedResponse<ProductWithStock>>(
      `/products${buildQueryString(filters)}`
    ),

  getProduct: (id: string) => api.get<ProductWithStock>(`/products/${id}`),

  createProduct: (payload: CreateProductPayload) =>
    api.post<Product>("/products", payload),

  updateProduct: (id: string, payload: Partial<CreateProductPayload>) =>
    api.put<Product>(`/products/${id}`, payload),

  deleteProduct: (id: string) => api.delete<void>(`/products/${id}`),

  getLowStockItems: () =>
    api.get<ProductWithStock[]>("/inventory-levels/low-stock"),

  getInventoryLevels: (productId: string) =>
    api.get<InventoryLevel[]>(`/inventory-levels?productId=${productId}`),

  adjustStock: (payload: AdjustStockPayload) =>
    api.post<StockAdjustment>("/inventory-levels/adjust", payload),

  getStockAdjustments: (productId: string) =>
    api.get<StockAdjustment[]>(`/stock-adjustments?productId=${productId}`),

  importCsv: async (file: File): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}> => {
  const token = (await import("../store/authStore.js")).useAuthStore.getState().token;
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/products/import-csv`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "CSV import failed.");
  }
  return response.json();
},

downloadCsvTemplate: () =>
  api.get<string>("/products/csv-template"),
};