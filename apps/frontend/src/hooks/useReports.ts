import { useQuery } from "@tanstack/react-query";
import { reportsService } from "../services/reports.service";
import { QUERY_KEYS } from "../lib/constants";

export function useReportSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT_SUMMARY,
    queryFn: reportsService.getSummary,
    staleTime: 5 * 60_000,
  });
}

export function useMovementReport(period: "6m" | "1y" | "ytd" = "6m") {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT_MOVEMENT(period),
    queryFn: () => reportsService.getMovement(period),
    staleTime: 5 * 60_000,
  });
}

export function useAgingReport() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT_AGING,
    queryFn: reportsService.getAgingReport,
    staleTime: 5 * 60_000,
  });
}

export function useSupplierPerformance() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORT_SUPPLIERS,
    queryFn: reportsService.getSupplierPerformance,
    staleTime: 5 * 60_000,
  });
}