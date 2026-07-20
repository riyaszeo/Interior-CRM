import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardReportData {
  total_projects: number;
  revenue_billed: number;
  collections_received: number;
  outstanding_receivables: number;
  purchase_spend: number;
  inventory_value: number;
}

export interface ProjectReportItem {
  id: number;
  name: string;
  project_code: string;
  budget: number;
  estimated_cost: number;
  actual_cost: number;
  completion_percent: number;
  total_invoiced: number;
  total_collected: number;
  outstanding: number;
  progress_logs_count: number;
}

export interface PurchaseReportData {
  by_status: Array<{ status: string; count: number; total: string }>;
  by_vendor: Array<{ name: string; count: number; total: string }>;
}

export interface StockReportItem {
  id: number;
  warehouse: string | null;
  material_name: string | null;
  sku: string | null;
  current_stock: number;
  reserved_stock: number;
  reorder_level: number;
  purchase_price: number;
  stock_value: number;
  unit: string | null;
  needs_reorder: boolean;
}

export interface SiteReportItem {
  id: number;
  name: string;
  project_code: string;
  diary_logs_count: number;
  attendance_count: number;
  expenses_count: number;
  expenses_claimed: number;
  expenses_approved: number;
}

export interface MaterialConsumptionItem {
  id: number;
  project_name: string | null;
  material_name: string | null;
  sku: string | null;
  warehouse: string | null;
  quantity_consumed: number;
  unit: string | null;
  unit_cost: number;
  total_cost: number;
  date: string;
  notes: string | null;
}

export interface VendorReportItem {
  id: number;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string;
  po_count: number;
  po_spend: number;
  pending_payment: number;
}

export interface CustomerReportItem {
  id: number;
  name: string;
  contact_name: string | null;
  email: string;
  phone: string;
  projects_count: number;
  total_invoiced: number;
  total_collected: number;
  outstanding: number;
}

export interface ProfitabilityReportItem {
  id: number;
  name: string;
  project_code: string;
  billed_revenue: number;
  collected_revenue: number;
  material_expense: number;
  labor_expense: number;
  petty_expense: number;
  total_incurred: number;
  net_profit: number;
  profit_margin: number;
}

interface ReportResponse<T> { success: boolean; data: T; message: string }

// ── Hook definitions ───────────────────────────────────────────────────────────

export function useDashboardReport() {
  return useQuery<ReportResponse<DashboardReportData>>({
    queryKey: ['report-dashboard'],
    queryFn: () => apiClient.get<ReportResponse<DashboardReportData>>('/reports/dashboard'),
  });
}

export function useProjectsReport() {
  return useQuery<ReportResponse<ProjectReportItem[]>>({
    queryKey: ['report-projects'],
    queryFn: () => apiClient.get<ReportResponse<ProjectReportItem[]>>('/reports/projects'),
  });
}

export function usePurchasesReport() {
  return useQuery<ReportResponse<PurchaseReportData>>({
    queryKey: ['report-purchases'],
    queryFn: () => apiClient.get<ReportResponse<PurchaseReportData>>('/reports/purchases'),
  });
}

export function useStockReport() {
  return useQuery<ReportResponse<StockReportItem[]>>({
    queryKey: ['report-stock'],
    queryFn: () => apiClient.get<ReportResponse<StockReportItem[]>>('/reports/stock'),
  });
}

export function useSiteReport() {
  return useQuery<ReportResponse<SiteReportItem[]>>({
    queryKey: ['report-site'],
    queryFn: () => apiClient.get<ReportResponse<SiteReportItem[]>>('/reports/site'),
  });
}

export function useMaterialConsumptionReport() {
  return useQuery<ReportResponse<MaterialConsumptionItem[]>>({
    queryKey: ['report-material-consumption'],
    queryFn: () => apiClient.get<ReportResponse<MaterialConsumptionItem[]>>('/reports/material-consumption'),
  });
}

export function useVendorsReport() {
  return useQuery<ReportResponse<VendorReportItem[]>>({
    queryKey: ['report-vendors'],
    queryFn: () => apiClient.get<ReportResponse<VendorReportItem[]>>('/reports/vendors'),
  });
}

export function useCustomersReport() {
  return useQuery<ReportResponse<CustomerReportItem[]>>({
    queryKey: ['report-customers'],
    queryFn: () => apiClient.get<ReportResponse<CustomerReportItem[]>>('/reports/customers'),
  });
}

export function useProfitabilityReport() {
  return useQuery<ReportResponse<ProfitabilityReportItem[]>>({
    queryKey: ['report-profitability'],
    queryFn: () => apiClient.get<ReportResponse<ProfitabilityReportItem[]>>('/reports/profitability'),
  });
}
