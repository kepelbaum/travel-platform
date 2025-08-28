export interface User {
  id: number;
  email: string;
  name: string;
  preferences?: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: boolean;
}

export interface Destination {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl?: string;
}

export interface Trip {
  id: number;
  userId: number;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'draft' | 'planned' | 'active' | 'completed';
  destinations: Destination[];
  tripActivities?: TripActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

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
