import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  contact_number: string | null;
  is_active: boolean;
  stocks_count?: number;
}

export interface MaterialBatch {
  id: number;
  material_id: number;
  batch_number: string;
  expiry_date: string | null;
  manufacturing_date: string | null;
  supplier_id: number | null;
}

export interface WarehouseStock {
  id: number;
  warehouse_id: number;
  material_id: number;
  batch_id: number | null;
  opening_stock: string;
  current_stock: string;
  reserved_stock: string;
  available_stock: number;
  warehouse?: Warehouse | null;
  material?: { id: number; name: string; sku: string; reorder_level: string; unit: string } | null;
  batch?: MaterialBatch | null;
}

export interface StockLedger {
  id: number;
  warehouse_id: number;
  material_id: number;
  batch_id: number | null;
  transaction_type: 'opening' | 'receipt' | 'dispatch' | 'return' | 'adjustment' | 'reserve' | 'release';
  quantity: string;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  warehouse?: Warehouse | null;
  material?: { id: number; name: string; sku: string } | null;
  batch?: MaterialBatch | null;
}

export interface InventoryFormOptions {
  warehouses: Array<{ id: number; name: string }>;
  materials: Array<{ id: number; name: string; sku: string; reorder_level: string }>;
  projects: Array<{ id: number; name: string }>;
  batches: Array<{ id: number; material_id: number; batch_number: string }>;
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

// ── WAREHOUSES ────────────────────────────────────────────────────────────────

export function useWarehousesList(page: number, search: string, perPage: number = 15) {
  const q = new URLSearchParams({ page: String(page), search, per_page: String(perPage) }).toString();
  return useQuery<PaginatedListResponse<Warehouse>>({
    queryKey: ['warehouses', page, search, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<Warehouse>>(`/warehouses?${q}`),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Warehouse>) => apiClient.post<SingleResponse<Warehouse>>('/warehouses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['inventory-form-options'] });
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Warehouse> }) =>
      apiClient.put<SingleResponse<Warehouse>>(`/warehouses/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['inventory-form-options'] });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/warehouses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      qc.invalidateQueries({ queryKey: ['inventory-form-options'] });
    },
  });
}

// ── STOCKS ────────────────────────────────────────────────────────────────────

export function useStocksList(
  page: number,
  warehouseId: number | null,
  materialId: number | null,
  search: string,
  lowStock: boolean = false,
  perPage: number = 15
) {
  const params = new URLSearchParams({ page: String(page), search, per_page: String(perPage) });
  if (warehouseId) params.set('warehouse_id', String(warehouseId));
  if (materialId) params.set('material_id', String(materialId));
  if (lowStock) params.set('low_stock', 'true');

  return useQuery<PaginatedListResponse<WarehouseStock>>({
    queryKey: ['inventory-stocks', page, warehouseId, materialId, search, lowStock, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<WarehouseStock>>(`/inventory/stocks?${params.toString()}`),
  });
}

// ── LEDGER ────────────────────────────────────────────────────────────────────

export function useLedgerList(
  page: number,
  warehouseId: number | null,
  materialId: number | null,
  type: string,
  perPage: number = 15
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (warehouseId) params.set('warehouse_id', String(warehouseId));
  if (materialId) params.set('material_id', String(materialId));
  if (type) params.set('transaction_type', type);

  return useQuery<PaginatedListResponse<StockLedger>>({
    queryKey: ['inventory-ledger', page, warehouseId, materialId, type, perPage],
    queryFn: () => apiClient.get<PaginatedListResponse<StockLedger>>(`/inventory/ledger?${params.toString()}`),
  });
}

// ── ADJUST / RESERVE ──────────────────────────────────────────────────────────

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { warehouse_id: number; material_id: number; batch_id?: number | null; transaction_type: string; quantity: number; notes?: string }) =>
      apiClient.post<SingleResponse<WarehouseStock>>('/inventory/adjust', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-ledger'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useReserveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { warehouse_id: number; material_id: number; batch_id?: number | null; project_id: number; quantity: number; action: 'reserve' | 'release' }) =>
      apiClient.post<SingleResponse<WarehouseStock>>('/inventory/reserve', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-ledger'] });
    },
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      source_warehouse_id: number;
      material_id: number;
      quantity: number;
      destination_branch_id: number;
      destination_warehouse_id: number;
      batch_id?: number | null;
      notes?: string;
    }) => apiClient.post<any>('/inventory/transfer', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-stocks'] });
      qc.invalidateQueries({ queryKey: ['inventory-ledger'] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useInventoryFormOptions() {
  return useQuery<SingleResponse<InventoryFormOptions>>({
    queryKey: ['inventory-form-options'],
    queryFn: () => apiClient.get<SingleResponse<InventoryFormOptions>>('/inventory/form-options'),
    staleTime: 120000,
  });
}
