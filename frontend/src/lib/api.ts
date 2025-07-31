import { useAuthStore } from '@/store/auth';
import { AuthResponse, Trip, Destination } from '@/types';

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

    console.log('🔥 API REQUEST:', {
      method: options.method || 'GET',
      url: `${API_BASE_URL}${endpoint}`,
      headers: config.headers,
      body: options.body,
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log('🔥 API RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    if (!response.ok) {
      console.log('🔥 API ERROR:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status}`);
    }

    // Handle empty responses (like DELETE operations)
    const text = await response.text();
    if (!text) {
      return null as T; // Return null for empty responses
    }

    const result = JSON.parse(text);
    console.log('🔥 API RESULT:', result);
    return result;
  };

  return {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, data: any) =>
      request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    put: <T>(endpoint: string, data: any) =>
      request<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  };
};

export const apiClient = createApiClient(API_BASE_URL);

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', userData),
};

export const tripsApi = {
  getUserTrips: (userId: number) =>
    apiClient.get<Trip[]>(`/trips?userId=${userId}`),
  getTripById: (tripId: number, userId: number) =>
    apiClient.get<Trip>(`/trips/${tripId}?userId=${userId}`),
  createTrip: (tripData: any, userId: number) =>
    apiClient.post<Trip>(`/trips?userId=${userId}`, tripData),
  updateTrip: (tripId: number, tripData: any, userId: number) =>
    apiClient.put<Trip>(`/trips/${tripId}?userId=${userId}`, tripData),
  deleteTrip: (tripId: number, userId: number) =>
    apiClient.delete<void>(`/trips/${tripId}?userId=${userId}`),
  addDestinationToTrip: (
    tripId: number,
    destinationId: number,
    userId: number
  ) =>
    apiClient.post<Trip>(
      `/trips/${tripId}/destinations/${destinationId}?userId=${userId}`,
      {}
    ),
  removeDestinationFromTrip: (
    tripId: number,
    destinationId: number,
    userId: number
  ) =>
    apiClient.delete<Trip>(
      `/trips/${tripId}/destinations/${destinationId}?userId=${userId}`
    ),
};

export const destinationsApi = {
  getAllDestinations: () => apiClient.get<Destination[]>('/destinations'),
  searchDestinations: (query: string) =>
    apiClient.get<Destination[]>(`/destinations/search?query=${query}`),
  getCountries: () => apiClient.get<string[]>('/destinations/countries'),
};
