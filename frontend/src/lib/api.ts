import { useAuthStore } from '@/store/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const createApiClient = (baseURL: string) => {
  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const { token } = useAuthStore.getState();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${baseURL}${endpoint}`, config);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  };

  return {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data: any) =>
      request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
};

export const apiClient = createApiClient(API_BASE_URL);
