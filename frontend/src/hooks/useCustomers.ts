import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface Customer {
  id: number;
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  gst_number: string | null;
  billing_address: string;
  site_address: string;
  lead_status: 'lead' | 'contacted' | 'proposal' | 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
    budget: string;
    start_date: string;
    end_date: string;
  }>;
  quotations?: Array<{
    id: number;
    title: string;
    amount: string;
    status: string;
  }>;
  documents?: Array<{
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    created_at: string;
  }>;
  timeline?: Array<{
    id: number;
    user_name: string;
    action: string;
    description: string;
    time: string;
    created_at: string;
  }>;
}

export interface CustomersListResponse {
  success: boolean;
  message: string;
  data: {
    items: Customer[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  };
}

export interface CustomerDetailsResponse {
  success: boolean;
  message: string;
  data: Customer;
}

// 1. Fetch paginated customers hook
export function useCustomersList(
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
  return useQuery<CustomersListResponse>({
    queryKey: ['customers', page, search, status, sortBy, sortOrder],
    queryFn: () => apiClient.get<CustomersListResponse>(`/customers?${queryParams}`),
  });
}

// 2. Fetch single customer details profile hook
export function useCustomerDetails(id: number | null) {
  return useQuery<CustomerDetailsResponse>({
    queryKey: ['customer', id],
    queryFn: () => apiClient.get<CustomerDetailsResponse>(`/customers/${id}`),
    enabled: id !== null && id > 0,
  });
}

// 3. Create customer mutation hook
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) =>
      apiClient.post<CustomerDetailsResponse>('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// 4. Update customer mutation hook
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Customer, 'id' | 'created_at' | 'updated_at'> }) =>
      apiClient.put<CustomerDetailsResponse>(`/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
}

// 5. Soft-delete customer mutation hook
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// 6. Upload customer document mutation hook
export function useUploadDocument(customerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<any>(`/customers/${customerId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });
}

// 7. Delete customer document mutation hook
export function useDeleteDocument(customerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => apiClient.delete<any>(`/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
    },
  });
}
