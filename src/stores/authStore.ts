import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {User} from '../domain/models';
import * as userRepo from '../data/repositories/userRepository';

interface AuthState {
  userId: string | null;
  currentUser: User | null;
  setSession: (userId: string) => Promise<void>;
  clearSession: () => void;
  hydrateUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      currentUser: null,
      setSession: async (userId: string) => {
        const u = await userRepo.getUserById(userId);
        set({userId, currentUser: u});
      },
      clearSession: () => set({userId: null, currentUser: null}),
      hydrateUser: async () => {
        const id = get().userId;
        if (!id) {
          set({currentUser: null});
          return;
        }
        const u = await userRepo.getUserById(id);
        set({currentUser: u});
      },
    }),
    {
      name: 'slipgo-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({userId: s.userId}),
    },
  ),
);
