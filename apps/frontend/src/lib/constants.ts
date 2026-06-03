export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const QUERY_KEYS = {
  // Auth
  ME: ["auth", "me"] as const,

  // Dashboard
  DASHBOARD_STATS: ["dashboard", "stats"] as const,
  DASHBOARD_TREND: ["dashboard", "trend"] as const,
  DASHBOARD_ACTIVITY: ["dashboard", "activity"] as const,
  DASHBOARD_TOP_PRODUCTS: ["dashboard", "top-products"] as const,

  // Products / Inventory
  PRODUCTS: ["products"] as const,
  PRODUCT: (id: string) => ["products", id] as const,
  INVENTORY_LEVELS: ["inventory-levels"] as const,
  INVENTORY_LEVEL: (productId: string) =>
    ["inventory-levels", productId] as const,
  LOW_STOCK: ["inventory-levels", "low-stock"] as const,
  STOCK_ADJUSTMENTS: (productId: string) =>
    ["stock-adjustments", productId] as const,

  // Purchase Orders
  PURCHASE_ORDERS: ["purchase-orders"] as const,
  PURCHASE_ORDER: (id: string) => ["purchase-orders", id] as const,
  SUPPLIERS: ["suppliers"] as const,

  // Sales Orders
  SALES_ORDERS: ["sales-orders"] as const,
  SALES_ORDER: (id: string) => ["sales-orders", id] as const,

  // Transfers
  TRANSFERS: ["transfers"] as const,
  TRANSFER: (id: string) => ["transfers", id] as const,

  // Warehouse
  ZONES: ["zones"] as const,
  ZONE: (id: string) => ["zones", id] as const,
  LOCATIONS: ["locations"] as const,

  // Reports
  REPORT_SUMMARY: ["reports", "summary"] as const,
  REPORT_AGING: ["reports", "aging"] as const,
  REPORT_MOVEMENT: (period: string) => ["reports", "movement", period] as const,
  REPORT_SUPPLIERS: ["reports", "suppliers"] as const,

  // Users
  USERS: ["users"] as const,
} as const;

export const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Hardware",
  "Food & Bev",
  "Other",
] as const;

export const ZONES_LIST = ["Zone A", "Zone B", "Zone C", "Zone D"] as const;

export const CARRIERS = ["FedEx", "UPS", "DHL", "Local Delivery"] as const;

export const ROLES = ["admin", "manager", "operator", "viewer"] as const;

export const ORDER_STATUSES = {
  purchase: [
    "draft",
    "confirmed",
    "shipped",
    "in_transit",
    "received",
    "cancelled",
  ],
  sales: [
    "processing",
    "picking",
    "packing",
    "dispatched",
    "delivered",
    "cancelled",
  ],
  transfer: ["draft", "in_transit", "completed", "cancelled"],
} as const;

export const PAGE_SIZE = 20;