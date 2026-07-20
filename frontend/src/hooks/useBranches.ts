import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface Branch {
  id: number;
  name: string;
  code: string;
  database_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CentralUser {
  id: number;
  name: string;
  email: string;
  branches: Branch[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export function useBranchesList() {
  return useQuery<SingleResponse<Branch[]>>({
    queryKey: ['branches'],
    queryFn: () => apiClient.get<SingleResponse<Branch[]>>('/branches'),
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post<SingleResponse<Branch>>('/branches', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Branch> }) =>
      apiClient.put<SingleResponse<Branch>>(`/branches/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete<any>(`/branches/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useCentralUsersList() {
  return useQuery<SingleResponse<CentralUser[]>>({
    queryKey: ['central-users'],
    queryFn: () => apiClient.get<SingleResponse<CentralUser[]>>('/branches/users-list'),
  });
}

export function useAssignBranches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, branchIds }: { userId: number; branchIds: number[] }) =>
      apiClient.post<SingleResponse<CentralUser>>(`/branches/assign-users/${userId}`, { branch_ids: branchIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['central-users'] });
    },
  });
}

export function useBranchWarehouses(branchId: number | null) {
  return useQuery<SingleResponse<Array<{ id: number; name: string; location: string }>>>({
    queryKey: ['branch-warehouses', branchId],
    queryFn: () => apiClient.get<SingleResponse<Array<{ id: number; name: string; location: string }>>>(`/branches/${branchId}/warehouses`),
    enabled: !!branchId,
  });
}
