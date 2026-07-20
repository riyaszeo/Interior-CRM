import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MaterialCategory {
  id: number;
  name: string;
  description: string | null;
  color: string;
  parent_id: number | null;
  parent?: { id: number; name: string } | null;
  children?: MaterialCategory[];
  materials_count?: number;
}

export interface MaterialBrand {
  id: number;
  name: string;
  description: string | null;
  materials_count?: number;
}

export interface MaterialUnit {
  id: number;
  name: string;
  abbreviation: string;
  materials_count?: number;
}

export interface Material {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  hsn_code: string | null;
  gst_rate: string;
  cost_price: string;
  purchase_price: string;
  selling_price: string;
  stock_quantity: string;
  reorder_level: string;
  unit: string;
  unit_id: number | null;
  category_id: number | null;
  brand_id: number | null;
  barcode: string | null;
  qr_data: string | null;
  is_active: boolean;
  needs_restock?: boolean;
  margin_percent?: number;
  created_at: string;
  category?: MaterialCategory | null;
  brand?: MaterialBrand | null;
  unitModel?: MaterialUnit | null;
}

export interface MaterialFormData {
  name: string;
  description: string;
  sku: string;
  hsn_code: string;
  gst_rate: number;
  category_id: number | null;
  brand_id: number | null;
  unit_id: number | null;
  unit: string;
  cost_price: number;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  barcode: string;
  is_active: boolean;
}

export interface MaterialFormOptions {
  categories: MaterialCategory[];
  brands: MaterialBrand[];
  units: MaterialUnit[];
  gst_rates: number[];
}

// ── Response wrappers ──────────────────────────────────────────────────────────

interface ListResponse {
  success: boolean;
  data: {
    items: Material[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

interface SingleResponse<T> { success: boolean; data: T; message: string }
interface ArrayResponse<T> { success: boolean; data: T[]; message: string }
interface FormOptionsResponse { success: boolean; data: MaterialFormOptions; message: string }

// ── Materials ──────────────────────────────────────────────────────────────────

export function useMaterialsList(
  page: number,
  search: string,
  categoryId: number | null,
  brandId: number | null,
  status: string,
  sortBy: string = 'name',
  sortOrder: string = 'asc',
  perPage: number = 15
) {
  const params = new URLSearchParams({
    page: String(page),
    search,
    status,
    sort_by: sortBy,
    sort_order: sortOrder,
    per_page: String(perPage),
  });
  if (categoryId) params.set('category_id', String(categoryId));
  if (brandId) params.set('brand_id', String(brandId));

  return useQuery<ListResponse>({
    queryKey: ['materials', page, search, categoryId, brandId, status, sortBy, sortOrder, perPage],
    queryFn: () => apiClient.get<ListResponse>(`/materials?${params.toString()}`),
  });
}

export function useMaterialFormOptions() {
  return useQuery<FormOptionsResponse>({
    queryKey: ['material-form-options'],
    queryFn: () => apiClient.get<FormOptionsResponse>('/materials/form-options'),
    staleTime: 120000,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaterialFormData) =>
      apiClient.post<SingleResponse<Material>>('/materials', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaterialFormData> }) =>
      apiClient.put<SingleResponse<Material>>(`/materials/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/materials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

// ── Lookup CRUD helpers ────────────────────────────────────────────────────────

// Categories
export function useCategoriesList() {
  return useQuery<ArrayResponse<MaterialCategory>>({
    queryKey: ['material-categories'],
    queryFn: () => apiClient.get<ArrayResponse<MaterialCategory>>('/material-categories'),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string; parent_id?: number | null }) =>
      apiClient.post<any>('/material-categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-categories'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.put<any>(`/material-categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-categories'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/material-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-categories'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

// Brands
export function useBrandsList() {
  return useQuery<ArrayResponse<MaterialBrand>>({
    queryKey: ['material-brands'],
    queryFn: () => apiClient.get<ArrayResponse<MaterialBrand>>('/material-brands'),
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiClient.post<any>('/material-brands', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-brands'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.put<any>(`/material-brands/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-brands'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/material-brands/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-brands'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

// Units
export function useUnitsList() {
  return useQuery<ArrayResponse<MaterialUnit>>({
    queryKey: ['material-units'],
    queryFn: () => apiClient.get<ArrayResponse<MaterialUnit>>('/material-units'),
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; abbreviation: string }) =>
      apiClient.post<any>('/material-units', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-units'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.put<any>(`/material-units/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-units'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/material-units/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material-units'] });
      qc.invalidateQueries({ queryKey: ['material-form-options'] });
    },
  });
}
