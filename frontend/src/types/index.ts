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
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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
