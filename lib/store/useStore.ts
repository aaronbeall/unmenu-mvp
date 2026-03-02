import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AppState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void;
}

export const useStore = create<AppState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}));
