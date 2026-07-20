import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  hsn_code: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
  gst_rate: string;
  gst_amount: string;
}

export interface Invoice {
  id: number;
  project_id: number;
  quotation_id: number | null;
  invoice_number: string;
  invoice_type: 'advance' | 'running' | 'final';
  invoice_date: string;
  due_date: string;
  payment_terms: string | null;
  subtotal: string;
  discount_amount: string;
  tax_rate: string;
  cgst: string;
  sgst: string;
  igst: string;
  total_gst: string;
  total_amount: string;
  status: 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';
  paid_amount: string;
  paid_at: string | null;
  notes: string | null;
  project?: { id: number; name: string; project_code: string; site_address?: string | null; customer?: { id: number; name: string } } | null;
  quotation?: { id: number; qtn_number: string } | null;
  items?: InvoiceItem[];
}

export interface InvoiceFormOptions {
  projects: Array<{
    id: number;
    name: string;
    project_code: string;
    customer_id: number;
    customer?: { id: number; name: string };
  }>;
  quotations: Array<{
    id: number;
    qtn_number: string;
    title: string;
    project_id: number;
    total: string;
  }>;
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

// ── INVOICES HOOKS ────────────────────────────────────────────────────────────

export function useInvoicesList(
  page: number,
  status: string,
  type: string,
  search: string,
  perPage: number = 10
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage), search });
  if (status) params.set('status', status);
  if (type) params.set('type', type);

  return useQuery<PaginatedListResponse<Invoice>>({
    queryKey: ['invoices', page, status, type, search, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<Invoice>>(`/invoices?${params.toString()}`),
  });
}

export function useInvoiceDetails(id: number | null) {
  return useQuery<SingleResponse<Invoice>>({
    queryKey: ['invoice', id],
    queryFn: () => apiClient.get<SingleResponse<Invoice>>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      project_id: number;
      quotation_id?: number | null;
      invoice_type: 'advance' | 'running' | 'final';
      invoice_date: string;
      due_date: string;
      payment_terms?: string;
      discount_amount?: number;
      tax_type?: 'local' | 'igst';
      notes?: string;
      items: Array<{
        description: string;
        hsn_code?: string;
        quantity: number;
        unit_price: number;
        gst_rate?: number;
      }>;
    }) => apiClient.post<SingleResponse<Invoice>>('/invoices', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['project'] }); // Invalidate project details to sync financial invoices
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, paid_at }: { id: number; amount: number; paid_at: string }) =>
      apiClient.post<SingleResponse<Invoice>>(`/invoices/${id}/payment`, { amount, paid_at }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', variables.id] });
      qc.invalidateQueries({ queryKey: ['project'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.patch<SingleResponse<Invoice>>(`/invoices/${id}/cancel`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['project'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useInvoiceFormOptions() {
  return useQuery<SingleResponse<InvoiceFormOptions>>({
    queryKey: ['invoice-form-options'],
    queryFn: () => apiClient.get<SingleResponse<InvoiceFormOptions>>('/invoices/form-options'),
    staleTime: 60000,
  });
}
