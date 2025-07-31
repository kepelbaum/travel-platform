import { create } from 'zustand';
import { Trip } from '@/types';

interface TripPlanningState {
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  clearActiveTrip: () => void;
}

export const useTripPlanningStore = create<TripPlanningState>((set) => ({
  activeTrip: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),
  clearActiveTrip: () => set({ activeTrip: null }),
}));
