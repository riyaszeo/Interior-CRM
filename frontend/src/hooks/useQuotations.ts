import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// Types
export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  room_name: string;
  item_name: string;
  material_id: number | null;
  description: string;
  width?: number | null;
  height?: number | null;
  units?: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  material?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface Quotation {
  id: number;
  qtn_number: string | null;
  customer_id: number | null;
  project_id: number | null;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  subtotal: string;
  gst_rate: string;
  gst_amount: string;
  discount_amount: string;
  labor_charges: string;
  additional_charges: string;
  total: string;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null; site_address?: string | null } | null;
  project?: { id: number; name: string; status: string; site_address?: string | null } | null;
  items?: QuotationItem[];
}

export interface QuotationFormData {
  customer_id: number | null;
  project_id: number | null;
  title: string;
  status: string;
  labor_charges: number;
  additional_charges: number;
  discount_amount: number;
  gst_rate: number;
  terms_conditions: string;
  items: Omit<QuotationItem, 'id' | 'quotation_id' | 'total_price' | 'material'>[];
}

export interface FormOptions {
  customers: Array<{ id: number; name: string; site_address: string }>;
  projects: Array<{ id: number; name: string; status: string }>;
  materials: Array<{ id: number; name: string; sku: string; unit: string; cost_price: string }>;
}

// Response types
interface ListResponse {
  success: boolean;
  message: string;
  data: {
    items: Quotation[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  };
}

interface DetailResponse {
  success: boolean;
  message: string;
  data: Quotation;
}

interface OptionsResponse {
  success: boolean;
  message: string;
  data: FormOptions;
}

// 1. Paginated list hook
export function useQuotationsList(
  page: number,
  search: string,
  status: string,
  sortBy: string = 'created_at',
  sortOrder: string = 'desc'
) {
  const queryParams = new URLSearchParams({
    page: String(page),
    search,
    status,
    sort_by: sortBy,
    sort_order: sortOrder,
  }).toString();

  return useQuery<ListResponse>({
    queryKey: ['quotations', page, search, status, sortBy, sortOrder],
    queryFn: () => apiClient.get<ListResponse>(`/quotations?${queryParams}`),
  });
}

// 2. Single quotation details
export function useQuotationDetails(id: number | null) {
  return useQuery<DetailResponse>({
    queryKey: ['quotation', id],
    queryFn: () => apiClient.get<DetailResponse>(`/quotations/${id}`),
    enabled: id !== null && id > 0,
  });
}

// 3. Form options (customers, projects, materials)
export function useQuotationFormOptions() {
  return useQuery<OptionsResponse>({
    queryKey: ['quotation-form-options'],
    queryFn: () => apiClient.get<OptionsResponse>('/quotations/form-options'),
    staleTime: 60000,
  });
}

// 4. Create quotation
export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: QuotationFormData) =>
      apiClient.post<DetailResponse>('/quotations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

// 5. Update quotation
export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuotationFormData }) =>
      apiClient.put<DetailResponse>(`/quotations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
    },
  });
}

// 6. Delete quotation
export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

// 7. Update status
export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.request<DetailResponse>(`/quotations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
    },
  });
}

// 8. Convert to project
export function useConvertToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.post<any>(`/quotations/${id}/convert-to-project`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
