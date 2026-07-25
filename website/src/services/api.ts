const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api-website.vksinteriorandexterior.com/api' : 'http://localhost:8001/api');

export const fetchAPI = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'API request failed') as any;
    error.errors = data.errors;
    throw error;
  }

  return data;
};
