import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface CompanyDetails {
  id: number;
  name: string;
  address: string | null;
  gstn: string | null;
  contact_no: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  data: CompanyDetails;
}

export function useCompanyDetails() {
  return useQuery<CompanyResponse>({
    queryKey: ['companyDetails'],
    queryFn: () => apiClient.get<CompanyResponse>('/company'),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation<CompanyResponse, Error, FormData>({
    mutationFn: (formData: FormData) => {
      return apiClient.upload<CompanyResponse>('/company', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
    },
  });
}
