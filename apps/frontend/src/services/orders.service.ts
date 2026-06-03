import { api } from "./api";
import { buildQueryString } from "../lib/utils";
import type { PaginatedResponse } from "./inventory.service";

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  onTimeDeliveryRate: number;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
  totalItems: number;
  totalValue: number;
  expectedDate: string;
  receivingDock: string;
  status:
    | "draft"
    | "confirmed"
    | "shipped"
    | "in_transit"
    | "received"
    | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePOPayload {
  supplierId: string;
  expectedDate: string;
  receivingDock: string;
  notes?: string;
  items: Array<{
    productId: string;
    orderedQty: number;
    unitCost: number;
  }>;
}

export interface ReceivePOPayload {
  items: Array<{
    purchaseOrderItemId: string;
    receivedQty: number;
    locationId: string;
  }>;
  notes?: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  pickedQty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  customerId?: string;
  items: SalesOrderItem[];
  totalItems: number;
  totalValue: number;
  requiredBy: string;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress: string;
  status:
    | "processing"
    | "picking"
    | "packing"
    | "dispatched"
    | "delivered"
    | "cancelled";
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSOPayload {
  customerName: string;
  customerId?: string;
  requiredBy: string;
  carrier?: string;
  shippingAddress: string;
  items: Array<{
    productId: string;
    orderedQty: number;
    unitPrice: number;
  }>;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  supplierId?: string;
  page?: number;
  pageSize?: number;
}

export const ordersService = {
  // Suppliers
  getSuppliers: () => api.get<Supplier[]>("/suppliers"),

  // Purchase Orders
  getPurchaseOrders: (filters: OrderFilters = {}) =>
    api.get<PaginatedResponse<PurchaseOrder>>(
      `/purchase-orders${buildQueryString(filters)}`
    ),

  getPurchaseOrder: (id: string) =>
    api.get<PurchaseOrder>(`/purchase-orders/${id}`),

  createPurchaseOrder: (payload: CreatePOPayload) =>
    api.post<PurchaseOrder>("/purchase-orders", payload),

  updatePOStatus: (
    id: string,
    status: PurchaseOrder["status"],
    notes?: string
  ) => api.patch<PurchaseOrder>(`/purchase-orders/${id}/status`, { status, notes }),

  receivePurchaseOrder: (id: string, payload: ReceivePOPayload) =>
    api.post<PurchaseOrder>(`/purchase-orders/${id}/receive`, payload),

  // Sales Orders
  getSalesOrders: (filters: OrderFilters = {}) =>
    api.get<PaginatedResponse<SalesOrder>>(
      `/sales-orders${buildQueryString(filters)}`
    ),

  getSalesOrder: (id: string) => api.get<SalesOrder>(`/sales-orders/${id}`),

  createSalesOrder: (payload: CreateSOPayload) =>
    api.post<SalesOrder>("/sales-orders", payload),

  updateSOStatus: (id: string, status: SalesOrder["status"]) =>
    api.patch<SalesOrder>(`/sales-orders/${id}/status`, { status }),

  dispatchOrder: (
    id: string,
    payload: { carrier: string; trackingNumber?: string }
  ) => api.post<SalesOrder>(`/sales-orders/${id}/dispatch`, payload),

  generatePickList: (id: string) =>
    api.get<{ url: string }>(`/sales-orders/${id}/pick-list`),
};