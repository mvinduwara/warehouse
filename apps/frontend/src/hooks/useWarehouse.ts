import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  warehouseService,
  type CreateTransferPayload,
} from "../services/warehouse.service";
import { useUIStore } from "../store/uiStore";
import { QUERY_KEYS } from "../lib/constants";

export function useZones() {
  return useQuery({
    queryKey: QUERY_KEYS.ZONES,
    queryFn: warehouseService.getZones,
    staleTime: 2 * 60_000,
  });
}

export function useZone(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ZONE(id),
    queryFn: () => warehouseService.getZone(id),
    enabled: Boolean(id),
  });
}

export function useLocations(zoneId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.LOCATIONS, zoneId],
    queryFn: () => warehouseService.getLocations(zoneId),
    staleTime: 2 * 60_000,
  });
}

export function useRackMap() {
  return useQuery({
    queryKey: ["locations", "rack-map"],
    queryFn: warehouseService.getRackMap,
    refetchInterval: 2 * 60_000,
    staleTime: 60_000,
  });
}

export function useTransfers(status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TRANSFERS, status],
    queryFn: () => warehouseService.getTransfers(status),
    staleTime: 30_000,
  });
}

export function useTransfer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.TRANSFER(id),
    queryFn: () => warehouseService.getTransfer(id),
    enabled: Boolean(id),
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const { addToast, closeModal } = useUIStore();

  return useMutation({
    mutationFn: (payload: CreateTransferPayload) =>
      warehouseService.createTransfer(payload),
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSFERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS });
      addToast("success", `Transfer ${transfer.transferNumber} created.`);
      closeModal();
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to create transfer.");
    },
  });
}

export function useConfirmTransfer() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => warehouseService.confirmTransfer(id),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSFERS });
      addToast("success", `Transfer ${t.transferNumber} confirmed — in transit.`);
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to confirm transfer.");
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => warehouseService.completeTransfer(id),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TRANSFERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY_LEVELS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ZONES });
      addToast("success", `Transfer ${t.transferNumber} completed.`);
    },
    onError: (err: Error) => {
      addToast("error", err.message ?? "Failed to complete transfer.");
    },
  });
}