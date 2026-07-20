import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MaterialRequestItem {
  id: number;
  material_request_id: number;
  material_id: number;
  quantity_requested: string;
  quantity_approved: string;
  notes: string | null;
  material?: { id: number; name: string; sku: string; purchase_price: string; unit: string } | null;
}

export interface MaterialRequest {
  id: number;
  request_number: string;
  project_id: number;
  warehouse_id: number;
  requested_by: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'dispatched' | 'cancelled';
  requested_date: string;
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  project?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  requester?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
  items: MaterialRequestItem[];
}

export interface MaterialDispatchItem {
  id: number;
  material_dispatch_id: number;
  material_id: number;
  batch_id: number | null;
  quantity_dispatched: string;
  cost_price: string;
  total_cost: string;
  material?: { id: number; name: string; sku: string; unit: string } | null;
  batch?: { id: number; batch_number: string } | null;
}

export interface MaterialDispatch {
  id: number;
  dispatch_number: string;
  material_request_id: number | null;
  project_id: number;
  warehouse_id: number;
  dispatched_by: number;
  dispatched_at: string;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  delivery_notes: string | null;
  delivery_date: string | null;
  total_cost: string;
  request?: MaterialRequest | null;
  project?: { id: number; name: string } | null;
  warehouse?: { id: number; name: string } | null;
  dispatcher?: { id: number; name: string } | null;
  items: MaterialDispatchItem[];
}

export interface DispatchFormOptions {
  projects: Array<{ id: number; name: string }>;
  warehouses: Array<{ id: number; name: string }>;
  materials: Array<{ id: number; name: string; sku: string; purchase_price: string }>;
  batches: Array<{ id: number; material_id: number; batch_number: string }>;
  approved_requests: Array<{ id: number; request_number: string; project_id: number; warehouse_id: number }>;
}

// ── Response wrappers ──────────────────────────────────────────────────────────

interface PaginatedListResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

interface SingleResponse<T> { success: boolean; data: T; message: string }

// ── REQUESTS HOOKS ────────────────────────────────────────────────────────────

export function useRequestsList(
  page: number,
  projectId: number | null,
  warehouseId: number | null,
  status: string,
  search: string,
  perPage: number = 15
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), search });
  if (projectId) params.set('project_id', String(projectId));
  if (warehouseId) params.set('warehouse_id', String(warehouseId));
  if (status) params.set('status', status);

  return useQuery<PaginatedListResponse<MaterialRequest>>({
    queryKey: ['material-requests', page, projectId, warehouseId, status, search, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<MaterialRequest>>(`/material-requests?${params.toString()}`),
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { project_id: number; warehouse_id: number; requested_date: string; notes?: string; items: Array<{ material_id: number; quantity_requested: number; notes?: string }> }) =>
      apiClient.post<SingleResponse<MaterialRequest>>('/material-requests', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-requests'] });
      qc.invalidateQueries({ queryKey: ['dispatch-form-options'] });
    },
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, items }: { id: number; status: 'approved' | 'rejected' | 'cancelled'; items?: Array<{ material_id: number; quantity_approved: number }> }) =>
      apiClient.patch<SingleResponse<MaterialRequest>>(`/material-requests/${id}/status`, { status, items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-requests'] });
      qc.invalidateQueries({ queryKey: ['dispatch-form-options'] });
    },
  });
}

// ── DISPATCHES HOOKS ──────────────────────────────────────────────────────────

export function useDispatchesList(
  page: number,
  projectId: number | null,
  warehouseId: number | null,
  deliveryStatus: string,
  search: string,
  perPage: number = 15
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), search });
  if (projectId) params.set('project_id', String(projectId));
  if (warehouseId) params.set('warehouse_id', String(warehouseId));
  if (deliveryStatus) params.set('delivery_status', deliveryStatus);

  return useQuery<PaginatedListResponse<MaterialDispatch>>({
    queryKey: ['material-dispatches', page, projectId, warehouseId, deliveryStatus, search, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<MaterialDispatch>>(`/material-dispatches?${params.toString()}`),
  });
}

export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      material_request_id?: number | null;
      project_id: number;
      warehouse_id: number;
      vehicle_number?: string;
      driver_name?: string;
      driver_phone?: string;
      receiver_name?: string;
      receiver_phone?: string;
      delivery_status: 'pending' | 'in_transit' | 'delivered';
      delivery_notes?: string;
      items: Array<{ material_id: number; batch_id?: number | null; quantity_dispatched: number }>;
    }) => apiClient.post<SingleResponse<MaterialDispatch>>('/material-dispatches', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-dispatches'] });
      qc.invalidateQueries({ queryKey: ['material-requests'] });
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-ledger'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      apiClient.patch<SingleResponse<MaterialDispatch>>(`/material-dispatches/${id}/delivery-status`, { delivery_status: status, delivery_notes: notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-dispatches'] });
    },
  });
}

export function useDispatchFormOptions() {
  return useQuery<SingleResponse<DispatchFormOptions>>({
    queryKey: ['dispatch-form-options'],
    queryFn: () => apiClient.get<SingleResponse<DispatchFormOptions>>('/material-requests/form-options'),
    staleTime: 60000,
  });
}
