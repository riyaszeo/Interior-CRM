import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

interface ProfileUpdateData {
  name: string;
  email: string;
}

interface PasswordChangeData {
  current_password: string;
  password:  string;
  password_confirmation: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdateData) =>
      apiClient.put<SingleResponse<any>>('/profile', data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChangeData) =>
      apiClient.put<SingleResponse<any>>('/change-password', data),
  });
}
