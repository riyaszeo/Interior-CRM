export interface MaterialDispatchedToday {
  count: number;
  cost: number;
}

export interface MaterialCostVsBudget {
  project_id: number;
  project_name: string;
  budget: number;
  actual_cost: number;
  remaining: number;
  percentage_used: number;
}

export interface SiteWiseProgress {
  project_id: number;
  project_name: string;
  progress_percentage: number;
  last_updated: string;
  notes: string;
}

export interface DashboardData {
  total_active_projects: number;
  projects_completed: number;
  projects_in_progress: number;
  materials_in_stock: number;
  materials_dispatched_today: MaterialDispatchedToday;
  pending_quotations: number;
  pending_invoices: number;
  purchase_orders_pending: number;
  monthly_revenue: number;
  material_cost_vs_budget: MaterialCostVsBudget[];
  site_wise_progress: SiteWiseProgress[];
}
