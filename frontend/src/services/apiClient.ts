const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api-erp.vksinteriorandexterior.com/api' : 'http://localhost:8000/api');

class ApiClient {
  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const branchId = localStorage.getItem('selected_branch_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (branchId) {
      headers['X-Branch-ID'] = branchId;
    }
    return headers;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Auto logout on unauthorized
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }

    const data = await response.json();

    if (!response.ok) {
      // Throw backend formatted error if available
      const message = data.message || 'API request failed';
      const error = new Error(message) as any;
      error.errors = data.errors;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  get<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Upload a file using multipart/form-data.
   * Calls fetch directly (bypassing request()) so Content-Type is NEVER set
   * manually — the browser auto-sets it with the correct multipart boundary.
   */
  upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const token = localStorage.getItem('auth_token');
    const branchId = localStorage.getItem('selected_branch_id');
    // Deliberately omit Content-Type — the browser sets it with boundary
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (branchId) headers['X-Branch-ID'] = branchId;

    return fetch(url, { method: 'POST', headers, body: formData })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
        }
        const data = await response.json();
        if (!response.ok) {
          const message = data.message || 'API request failed';
          const error = new Error(message) as any;
          error.errors = data.errors;
          error.status = response.status;
          throw error;
        }
        return data as T;
      });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
