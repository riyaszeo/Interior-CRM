import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export function useRolesList() {
  return useQuery<SingleResponse<Role[]>>({
    queryKey: ['roles'],
    queryFn: () => apiClient.get<SingleResponse<Role[]>>('/roles'),
  });
}

export function usePermissionsList() {
  return useQuery<SingleResponse<Permission[]>>({
    queryKey: ['permissions'],
    queryFn: () => apiClient.get<SingleResponse<Permission[]>>('/permissions'),
  });
}

export function useSyncRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      apiClient.post<SingleResponse<Role>>(`/roles/${roleId}/permissions`, { permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
