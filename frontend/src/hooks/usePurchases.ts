import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Vendor {
  id: number;
  name: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number: string | null;
  payment_terms: string | null;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  material_id: number;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  received_quantity: string;
  material?: { id: number; name: string; sku: string; unit: string } | null;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  project_id: number | null;
  order_date: string;
  delivery_date: string | null;
  subtotal: string;
  tax_amount: string;
  discount: string;
  total_amount: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';
  approved_by: number | null;
  approved_at: string | null;
  notes: string | null;
  terms_conditions: string | null;
  vendor?: Vendor | null;
  project?: { id: number; name: string } | null;
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptNoteItem {
  id: number;
  goods_receipt_note_id: number;
  purchase_order_item_id: number;
  material_id: number;
  quantity_ordered: string;
  quantity_received: string;
  quantity_accepted: string;
  quantity_rejected: string;
  rejection_reason: string | null;
  material?: { id: number; name: string; sku: string } | null;
}

export interface GoodsReceiptNote {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  received_date: string;
  received_by: number;
  status: 'draft' | 'completed' | 'cancelled';
  notes: string | null;
  receiver?: { id: number; name: string } | null;
  purchase_order?: PurchaseOrder | null;
  items?: GoodsReceiptNoteItem[];
}

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  purchase_order_id: number | null;
  vendor_id: number;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  status: 'unpaid' | 'paid' | 'partially_paid' | 'cancelled';
  payment_date: string | null;
  payment_method: string | null;
  vendor?: Vendor | null;
  purchase_order?: PurchaseOrder | null;
}

export interface PurchaseReturnItem {
  id: number;
  purchase_return_id: number;
  material_id: number;
  quantity: string;
  unit_price: string;
  refund_amount: string;
  material?: { id: number; name: string; sku: string } | null;
}

export interface PurchaseReturn {
  id: number;
  return_number: string;
  purchase_order_id: number | null;
  vendor_id: number;
  return_date: string;
  return_reason: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  total_refund_amount: string;
  vendor?: Vendor | null;
  purchase_order?: PurchaseOrder | null;
  items?: PurchaseReturnItem[];
}

export interface PurchaseFormOptions {
  vendors: Array<{ id: number; name: string; company_name: string }>;
  projects: Array<{ id: number; name: string }>;
  materials: Array<{ id: number; name: string; sku: string; purchase_price: string; gst_rate: string }>;
}

// ── Response Wrappers ──────────────────────────────────────────────────────────

interface PaginatedListResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

interface SingleResponse<T> { success: boolean; data: T; message: string }

// ── VENDORS ──────────────────────────────────────────────────────────────────

export function useVendorsList(page: number, search: string, perPage: number = 15) {
  const q = new URLSearchParams({ page: String(page), search, per_page: String(perPage) }).toString();
  return useQuery<PaginatedListResponse<Vendor>>({
    queryKey: ['vendors', page, search, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<Vendor>>(`/vendors?${q}`),
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) => apiClient.post<SingleResponse<Vendor>>('/vendors', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['purchase-order-form-options'] });
    },
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Vendor> }) =>
      apiClient.put<SingleResponse<Vendor>>(`/vendors/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['purchase-order-form-options'] });
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/vendors/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['purchase-order-form-options'] });
    },
  });
}

// ── PURCHASE ORDERS ───────────────────────────────────────────────────────────

export function usePOsList(page: number, search: string, status: string, vendorId: number | null, perPage: number = 15) {
  const params = new URLSearchParams({ page: String(page), search, status, per_page: String(perPage) });
  if (vendorId) params.set('vendor_id', String(vendorId));

  return useQuery<PaginatedListResponse<PurchaseOrder>>({
    queryKey: ['purchase-orders', page, search, status, vendorId, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<PurchaseOrder>>(`/purchase-orders?${params.toString()}`),
  });
}

export function usePODetails(id: number | null) {
  return useQuery<SingleResponse<PurchaseOrder>>({
    queryKey: ['purchase-order', id],
    queryFn: () => apiClient.get<SingleResponse<PurchaseOrder>>(`/purchase-orders/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function usePOFormOptions() {
  return useQuery<SingleResponse<PurchaseFormOptions>>({
    queryKey: ['purchase-order-form-options'],
    queryFn: () => apiClient.get<SingleResponse<PurchaseFormOptions>>('/purchase-orders/form-options'),
    staleTime: 120000,
  });
}

export function useCreatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post<SingleResponse<PurchaseOrder>>('/purchase-orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdatePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.put<SingleResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
    },
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.request<SingleResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
    },
  });
}

export function useDeletePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/purchase-orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });
}

// ── GOODS RECEIPT NOTES (GRN) ─────────────────────────────────────────────

export function useGRNsList(page: number, perPage: number = 15) {
  return useQuery<PaginatedListResponse<GoodsReceiptNote>>({
    queryKey: ['grns', page, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<GoodsReceiptNote>>(`/grns?page=${page}&per_page=${perPage}`),
  });
}

export function useGRNDetails(id: number | null) {
  return useQuery<SingleResponse<GoodsReceiptNote>>({
    queryKey: ['grn', id],
    queryFn: () => apiClient.get<SingleResponse<GoodsReceiptNote>>(`/grns/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function useCreateGRN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post<SingleResponse<GoodsReceiptNote>>('/grns', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grns'] });
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useCompleteGRN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.request<SingleResponse<GoodsReceiptNote>>(`/grns/${id}/complete`, {
        method: 'PATCH',
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['grns'] });
      qc.invalidateQueries({ queryKey: ['grn', id] });
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

// ── PURCHASE INVOICES ─────────────────────────────────────────────────────

export function usePurchaseInvoicesList(page: number, perPage: number = 15) {
  return useQuery<PaginatedListResponse<PurchaseInvoice>>({
    queryKey: ['purchase-invoices', page, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<PurchaseInvoice>>(`/purchase-invoices?page=${page}&per_page=${perPage}`),
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post<SingleResponse<PurchaseInvoice>>('/purchase-invoices', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-invoices'] }),
  });
}

export function useUpdatePurchaseInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.put<SingleResponse<PurchaseInvoice>>(`/purchase-invoices/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-invoices'] }),
  });
}

// ── PURCHASE RETURNS ──────────────────────────────────────────────────────

export function usePurchaseReturnsList(page: number, perPage: number = 15) {
  return useQuery<PaginatedListResponse<PurchaseReturn>>({
    queryKey: ['purchase-returns', page, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<PurchaseReturn>>(`/purchase-returns?page=${page}&per_page=${perPage}`),
  });
}

export function usePurchaseReturnDetails(id: number | null) {
  return useQuery<SingleResponse<PurchaseReturn>>({
    queryKey: ['purchase-return', id],
    queryFn: () => apiClient.get<SingleResponse<PurchaseReturn>>(`/purchase-returns/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function useCreatePurchaseReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post<SingleResponse<PurchaseReturn>>('/purchase-returns', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-returns'] });
    },
  });
}

export function useCompletePurchaseReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.request<SingleResponse<PurchaseReturn>>(`/purchase-returns/${id}/complete`, {
        method: 'PATCH',
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-returns'] });
      qc.invalidateQueries({ queryKey: ['purchase-return', id] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
