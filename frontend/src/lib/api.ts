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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Handle empty responses (like DELETE operations)
    const text = await response.text();
    if (!text) {
      return null as T; // Return null for empty responses
    }

    const result = JSON.parse(text);
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

// Add these interfaces to your types if not already there
export interface Activity {
  id: number;
  name: string;
  description?: string;
  category: string;
  durationMinutes?: number;
  estimatedCost?: number;
  priceLevel?: number;
  photoUrl?: string;
  rating?: number;
  userRatingsTotal?: number;
  address?: string;
  openingHours?: string;
  placeId?: string;
  destinationId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripActivity {
  id: number;
  tripId: number;
  activityId: number;
  activity: Activity;
  plannedDate: string;
  startTime: string;
  durationMinutes?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
}

export interface ActivityResponse {
  activities: Activity[];
  count: number;
  totalCount?: number;
  hasMore?: boolean;
  currentPage?: number;
  source: string;
  query?: string;
  category?: string;
  cacheStats?: {
    totalActivities: number;
    lastRefresh: string;
    isCacheStale: boolean;
    cacheTtlDays: number;
  };
}

// Define proper parameter interfaces
interface PaginationParams {
  page?: number;
  size?: number;
}

interface CategoryPaginationParams extends PaginationParams {
  category?: string;
}

export const activitiesApi = {
  // Smart cached activities
  getActivitiesSmart: (destinationId: number) =>
    apiClient.get<ActivityResponse>(
      `/activities/destination/${destinationId}/smart`
    ),

  // Force refresh activities from Google Places
  refreshActivities: (destinationId: number) =>
    apiClient.post<ActivityResponse>(
      `/activities/destination/${destinationId}/refresh`,
      {}
    ),

  // Get cache stats
  getCacheStats: (destinationId: number) =>
    apiClient.get<any>(`/activities/destination/${destinationId}/cache-stats`),

  // Get all categories
  getCategories: () => apiClient.get<string[]>('/activities/categories'),

  // Search activities
  searchActivities: (destinationId: number, query: string) =>
    apiClient.get<Activity[]>(
      `/activities/destination/${destinationId}/search?query=${query}`
    ),

  // Get top rated activities
  getTopRatedActivities: (destinationId: number) =>
    apiClient.get<Activity[]>(
      `/activities/destination/${destinationId}/top-rated`
    ),

  // Create custom activity
  createCustomActivity: (
    destinationId: number,
    data: {
      name: string;
      category: string;
      durationMinutes?: number;
      estimatedCost?: number;
      description?: string;
    }
  ) => {
    const params = new URLSearchParams({
      name: data.name,
      category: data.category,
      ...(data.durationMinutes && {
        durationMinutes: data.durationMinutes.toString(),
      }),
      ...(data.estimatedCost && {
        estimatedCost: data.estimatedCost.toString(),
      }),
      ...(data.description && { description: data.description }),
    });
    return apiClient.post<Activity>(
      `/activities/destination/${destinationId}/custom?${params}`,
      {}
    );
  },

  // Fixed paginated activities with proper typing
  getActivitiesPaginated: (
    destinationId: number,
    params: CategoryPaginationParams = {}
  ) => {
    const category = params.category || 'all';
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      size: (params.size || 20).toString(),
    });
    return apiClient.get<ActivityResponse>(
      `/activities/destination/${destinationId}/category/${category}?${queryParams}`
    );
  },

  searchActivitiesPaginated: (
    destinationId: number,
    query: string,
    params: PaginationParams = {}
  ) => {
    const queryParams = new URLSearchParams({
      query,
      page: (params.page || 1).toString(),
      size: (params.size || 20).toString(),
    });
    return apiClient.get<ActivityResponse>(
      `/activities/destination/${destinationId}/search?${queryParams}`
    );
  },
};

export const tripActivitiesApi = {
  scheduleActivity: (data: {
    tripId: number;
    activityId: number;
    plannedDate: string;
    startTime: string;
    durationMinutes: number;
  }) => {
    const params = new URLSearchParams({
      tripId: data.tripId.toString(),
      activityId: data.activityId.toString(),
      plannedDate: data.plannedDate,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes.toString(),
    });
    return apiClient.post<TripActivity>(
      `/trip-activities/schedule?${params}`,
      {}
    );
  },

  getScheduledActivities: (tripId: number) =>
    apiClient.get<TripActivity[]>(`/trip-activities/trip/${tripId}`),

  getActivitiesForDate: (tripId: number, date: string) =>
    apiClient.get<TripActivity[]>(
      `/trip-activities/trip/${tripId}/date/${date}`
    ),

  updateScheduledActivity: (
    tripActivityId: number,
    data: {
      plannedDate?: string;
      startTime?: string;
      durationMinutes?: number;
      notes?: string;
    }
  ) => {
    const params = new URLSearchParams();
    if (data.plannedDate) params.append('plannedDate', data.plannedDate);
    if (data.startTime) params.append('startTime', data.startTime);
    if (data.durationMinutes)
      params.append('durationMinutes', data.durationMinutes.toString());
    if (data.notes) params.append('notes', data.notes);

    return apiClient.put<TripActivity>(
      `/trip-activities/${tripActivityId}?${params}`,
      {}
    );
  },

  removeActivityFromTrip: (tripActivityId: number) =>
    apiClient.delete<void>(`/trip-activities/${tripActivityId}`),

  updateActualCost: (tripActivityId: number, actualCost: number) => {
    const params = new URLSearchParams({ actualCost: actualCost.toString() });
    return apiClient.put<TripActivity>(
      `/trip-activities/${tripActivityId}/actual-cost?${params}`,
      {}
    );
  },

  getTripCosts: (tripId: number) =>
    apiClient.get<{
      estimatedCost: number;
      actualCost: number;
      activityCount: number;
    }>(`/trip-activities/trip/${tripId}/costs`),
};
