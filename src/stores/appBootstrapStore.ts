import {create} from 'zustand';
import {getDatabase} from '../data/db/database';

interface BootstrapState {
  ready: boolean;
  error: string | null;
  init: () => Promise<void>;
}

export const useBootstrapStore = create<BootstrapState>((set) => ({
  ready: false,
  error: null,
  init: async () => {
    try {
      await getDatabase();
      set({ready: true, error: null});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ready: false, error: msg});
    }
  },
}));
