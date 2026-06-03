import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  inventoryService,
  type ProductsFilters,
  type CreateProductPayload,
  type AdjustStockPayload,
} from "../services/inventory.service";
import { useUIStore } from "../store/uiStore";
import { QUERY_KEYS } from "../lib/constants";

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS,
    queryFn: inventoryService.getDashboardStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useStockTrend(days = 30) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD_TREND, days],
    queryFn: () => inventoryService.getStockTrend(days),
    staleTime: 5 * 60_000,
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD_ACTIVITY, limit],
    queryFn: () => inventoryService.getRecentActivity(limit),
    refetchInterval: 30_000,
  });
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: [...QUERY_KEYS.DASHBOARD_TOP_PRODUCTS, limit],
    queryFn: () => inventoryService.getTopProducts(limit),
    staleTime: 5 * 60_000,
  });
}

export function useCategoryDistribution() {
  return useQuery({
    queryKey: ["dashboard", "categories"],
    queryFn: inventoryService.getCategoryDistribution,
    staleTime: 10 * 60_000,
  });
}

export function useProducts(filters: ProductsFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => inventoryService.getProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCT(id),
    queryFn: () => inventoryService.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { addToast, closeModal } = useUIStore();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      inventoryService.createProduct(payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      addToast("success", `Product "${product.name}" created successfully.`);
      closeModal();
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to create product.");
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  const { addToast, closeModal } = useUIStore();

  return useMutation({
    mutationFn: (payload: Partial<CreateProductPayload>) =>
      inventoryService.updateProduct(id, payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(id) });
      addToast("success", `"${product.name}" updated.`);
      closeModal();
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to update product.");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      addToast("success", "Product deleted.");
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to delete product.");
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: QUERY_KEYS.LOW_STOCK,
    queryFn: inventoryService.getLowStockItems,
    refetchInterval: 60_000,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (payload: AdjustStockPayload) =>
      inventoryService.adjustStock(payload),
    onSuccess: (adj) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.STOCK_ADJUSTMENTS(adj.productId),
      });
      addToast(
        "success",
        `Stock adjusted by ${adj.delta > 0 ? "+" : ""}${adj.delta} units.`
      );
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to adjust stock.");
    },
  });
}