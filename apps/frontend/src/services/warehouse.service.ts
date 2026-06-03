import { api } from "./api";

export interface Zone {
  id: string;
  name: string;
  label: string;
  category: string;
  totalCapacity: number;
  usedCapacity: number;
  occupancyPercent: number;
  totalLocations: number;
  activeLocations: number;
}

export interface WarehouseLocation {
  id: string;
  zoneId: string;
  zone: string;
  rack: string;
  bin: string;
  label: string;
  maxCapacity: number;
  currentQty: number;
  occupancyPercent: number;
  isEmpty: boolean;
}

export interface RackMapCell {
  locationId: string;
  label: string;
  rack: string;
  zone: string;
  occupancyPercent: number;
  status: "full" | "high" | "mid" | "low" | "empty";
}

export interface Transfer {
  id: string;
  transferNumber: string;
  fromZoneId: string;
  fromZone: string;
  fromLocation: string;
  toZoneId: string;
  toZone: string;
  toLocation: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  reason: string;
  status: "draft" | "in_transit" | "completed" | "cancelled";
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateTransferPayload {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
  reason: string;
}

export const warehouseService = {
  // Zones
  getZones: () => api.get<Zone[]>("/zones"),
  getZone: (id: string) => api.get<Zone>(`/zones/${id}`),

  // Locations
  getLocations: (zoneId?: string) =>
    api.get<WarehouseLocation[]>(`/locations${zoneId ? `?zoneId=${zoneId}` : ""}`),

  getRackMap: () => api.get<RackMapCell[]>("/locations/rack-map"),

  // Transfers
  getTransfers: (status?: string) =>
    api.get<Transfer[]>(`/transfers${status ? `?status=${status}` : ""}`),

  getTransfer: (id: string) => api.get<Transfer>(`/transfers/${id}`),

  createTransfer: (payload: CreateTransferPayload) =>
    api.post<Transfer>("/transfers", payload),

  confirmTransfer: (id: string) =>
    api.patch<Transfer>(`/transfers/${id}/confirm`, {}),

  completeTransfer: (id: string) =>
    api.patch<Transfer>(`/transfers/${id}/complete`, {}),

  cancelTransfer: (id: string) =>
    api.patch<Transfer>(`/transfers/${id}/cancel`, {}),
};