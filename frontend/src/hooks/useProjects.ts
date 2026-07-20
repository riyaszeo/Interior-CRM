import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProjectMilestone {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'completed' | 'delayed';
  completed_at: string | null;
  created_at: string;
}

export interface ProjectProgressLog {
  id: number;
  project_id: number;
  logged_by: number | null;
  log_date: string;
  description: string;
  completion_percent: number;
  customer_approved: boolean;
  customer_approved_at: string | null;
  customer_feedback: string | null;
  logger?: { id: number; name: string } | null;
  created_at: string;
}

export interface MaterialConsumption {
  id: number;
  project_id: number;
  warehouse_id: number;
  material_id: number;
  batch_id: number | null;
  quantity_consumed: string;
  consumption_date: string;
  logged_by: number;
  notes: string | null;
  material?: { id: number; name: string; sku: string; unit: string } | null;
  warehouse?: { id: number; name: string } | null;
  batch?: { id: number; batch_number: string } | null;
  logger?: { id: number; name: string } | null;
}

export interface WorkerAttendance {
  id: number;
  project_id: number;
  worker_name: string;
  worker_type: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'half_day';
  logged_by: number;
  logger?: { id: number; name: string } | null;
}

export interface SiteExpense {
  id: number;
  project_id: number;
  title: string;
  amount: string;
  expense_date: string;
  category: 'petty_purchase' | 'food' | 'transport' | 'tools' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  receipt_path: string | null;
  logged_by: number;
  approved_by: number | null;
  logger?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
}

export interface ProjectTeamMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string | null;
  assigned_at: string;
  user?: { id: number; name: string; email: string } | null;
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  file_name: string;
  file_path: string;
  file_type: 'document' | 'image' | 'video';
  mime_type: string | null;
  file_size: number | null;
  url: string;
  uploader?: { id: number; name: string } | null;
  created_at: string;
}

export interface Project {
  id: number;
  project_code: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'in_progress' | 'pending' | 'on_hold';
  site_address: string | null;
  site_contact_name: string | null;
  site_contact_phone: string | null;
  budget: string;
  material_budget: string;
  estimated_cost: string;
  actual_cost: string;
  completion_percent: number;
  start_date: string | null;
  end_date: string | null;
  customer_id: number | null;
  project_manager_id: number | null;
  created_at: string;
  customer?: { id: number; name: string; email?: string } | null;
  manager?: { id: number; name: string; email?: string } | null;
  milestones?: ProjectMilestone[];
  progressLogs?: ProjectProgressLog[];
  teamMembers?: ProjectTeamMember[];
  documents?: ProjectDocument[];
  materialConsumptions?: MaterialConsumption[];
  workerAttendances?: WorkerAttendance[];
  siteExpenses?: SiteExpense[];
  quotations?: Array<{ id: number; project_id: number; qtn_number: string; title: string; total: string; status: string }>;
  invoices?: Array<{ id: number; project_id: number; invoice_number: string; amount: string; status: string }>;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  site_address: string;
  site_contact_name: string;
  site_contact_phone: string;
  budget: number;
  material_budget: number;
  estimated_cost: number;
  actual_cost: number;
  completion_percent: number;
  start_date: string;
  end_date: string;
  customer_id: number | null;
  project_manager_id: number | null;
}

// ── API Response wrappers ──────────────────────────────────────────────────────

interface ListResponse {
  success: boolean;
  data: {
    items: Project[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

interface DetailResponse { success: boolean; data: Project; message: string }
interface UsersResponse { success: boolean; data: Array<{ id: number; name: string; email: string; roles: string[] }> }

// ── Project list & details ─────────────────────────────────────────────────────

export function useProjectsList(
  page: number, search: string, status: string,
  sortBy: string = 'created_at', sortOrder: string = 'desc', perPage: number = 10
) {
  const q = new URLSearchParams({ page: String(page), search, status, sort_by: sortBy, sort_order: sortOrder, per_page: String(perPage) }).toString();
  return useQuery<ListResponse>({
    queryKey: ['projects', page, search, status, sortBy, sortOrder, perPage],
    queryFn: () => apiClient.get<ListResponse>(`/projects?${q}`),
  });
}

export function useProjectDetails(id: number | null) {
  return useQuery<DetailResponse>({
    queryKey: ['project', id],
    queryFn: () => apiClient.get<DetailResponse>(`/projects/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function useUsersList() {
  return useQuery<UsersResponse>({
    queryKey: ['users-list'],
    queryFn: () => apiClient.get<UsersResponse>('/projects/users-list'),
    staleTime: 120000,
  });
}

// ── Project CRUD ───────────────────────────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectFormData) => apiClient.post<DetailResponse>('/projects', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> }) =>
      apiClient.put<DetailResponse>(`/projects/${id}`, data),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', v.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ── Milestones ─────────────────────────────────────────────────────────────────

export function useAddMilestone(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; due_date?: string; status?: string }) =>
      apiClient.post<any>(`/projects/${projectId}/milestones`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useUpdateMilestone(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mid, data }: { mid: number; data: Partial<ProjectMilestone> }) =>
      apiClient.request<any>(`/projects/${projectId}/milestones/${mid}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useDeleteMilestone(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mid: number) => apiClient.delete<any>(`/projects/${projectId}/milestones/${mid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

// ── Progress Logs ──────────────────────────────────────────────────────────────

export function useAddProgressLog(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { log_date: string; description: string; completion_percent: number }) =>
      apiClient.post<any>(`/projects/${projectId}/progress-logs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ── Team Members ───────────────────────────────────────────────────────────────

export function useAddTeamMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { user_id: number; role?: string }) =>
      apiClient.post<any>(`/projects/${projectId}/team-members`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useRemoveTeamMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => apiClient.delete<any>(`/projects/${projectId}/team-members/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

// ── Documents ──────────────────────────────────────────────────────────────────

export function useUploadDocument(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return apiClient.upload<any>(`/projects/${projectId}/documents`, fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

export function useDeleteDocument(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: number) => apiClient.delete<any>(`/projects/${projectId}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  });
}

// ── Daily Progress Customer Approval ─────────────────────────────────────

export function useApproveProgressLog(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, customer_approved, customer_feedback }: { logId: number; customer_approved: boolean; customer_feedback?: string }) =>
      apiClient.patch<any>(`/projects/${projectId}/progress-logs/${logId}/approve`, { customer_approved, customer_feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// ── Material Consumption ─────────────────────────────────────────────────

export function useLogMaterialConsumption(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { warehouse_id: number; material_id: number; batch_id?: number | null; quantity_consumed: number; consumption_date: string; notes?: string }) =>
      apiClient.post<any>(`/projects/${projectId}/material-consumptions`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-ledger'] });
    },
  });
}

// ── Worker Attendance ────────────────────────────────────────────────────

export function useLogWorkerAttendance(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { attendance_date: string; items: Array<{ worker_name: string; worker_type: string; status: 'present' | 'absent' | 'half_day' }> }) =>
      apiClient.post<any>(`/projects/${projectId}/worker-attendances`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// ── Site Expenses ────────────────────────────────────────────────────────

export function useLogExpense(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, amount, expense_date, category, receipt }: { title: string; amount: number; expense_date: string; category: string; receipt?: File | null }) => {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('amount', String(amount));
      fd.append('expense_date', expense_date);
      fd.append('category', category);
      if (receipt) {
        fd.append('receipt', receipt);
      }
      return apiClient.upload<any>(`/projects/${projectId}/expenses`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useProcessExpenseApproval(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, status }: { expenseId: number; status: 'approved' | 'rejected' }) =>
      apiClient.patch<any>(`/projects/${projectId}/expenses/${expenseId}/approve`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] }); // Invalidate list to sync actual_cost changes
    },
  });
}
