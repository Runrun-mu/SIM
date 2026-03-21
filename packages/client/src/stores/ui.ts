import { create } from 'zustand';

interface UIStore {
  speed: number;
  showTimeline: boolean;
  showDashboard: boolean;
  setSpeed: (speed: number) => void;
  toggleTimeline: () => void;
  toggleDashboard: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  speed: 1,
  showTimeline: true,
  showDashboard: true,
  setSpeed: (speed) => set({ speed }),
  toggleTimeline: () => set((s) => ({ showTimeline: !s.showTimeline })),
  toggleDashboard: () => set((s) => ({ showDashboard: !s.showDashboard })),
}));
