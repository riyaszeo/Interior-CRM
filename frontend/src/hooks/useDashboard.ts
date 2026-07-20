import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    kpi: {
      total_active_projects: number;
      projects_completed: number;
      projects_in_progress: number;
      materials_in_stock: number;
      materials_dispatched_today: {
        count: number;
        cost: number;
      };
      pending_quotations: number;
      pending_invoices: number;
      purchase_orders_pending: number;
      monthly_revenue: number;
    };
    charts: {
      revenue: Array<{ month: string; amount: number }>;
      project_status: Array<{ id: number; value: number; label: string }>;
      purchases: Array<{ month: string; amount: number }>;
      material_consumption: Array<{ month: string; amount: number }>;
      site_wise_progress: Array<{
        project_id: number;
        project_name: string;
        progress_percentage: number;
        last_updated: string;
      }>;
      material_cost_vs_budget: Array<{
        project_id: number;
        project_name: string;
        budget: number;
        actual_cost: number;
        remaining: number;
        percentage_used: number;
      }>;
    };
    lists: {
      recent_activities: Array<{
        id: number;
        user: string;
        action: string;
        description: string;
        time: string;
      }>;
      recent_quotations: Array<{
        id: number;
        client_name: string;
        title: string;
        amount: number;
        status: string;
        time: string;
      }>;
      recent_purchases: Array<{
        id: number;
        po_number: string;
        vendor_name: string;
        amount: number;
        status: string;
        time: string;
      }>;
      recent_dispatches: Array<{
        id: number;
        project_name: string;
        material_name: string;
        quantity: number;
        cost: number;
        time: string;
      }>;
    };
    notifications: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
    }>;
  };
}

export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboardData'],
    queryFn: () => apiClient.get<DashboardResponse>('/dashboard'),
    refetchInterval: 60000, // 60s auto refresh
    refetchIntervalInBackground: true,
  });
}
export default useDashboard;
