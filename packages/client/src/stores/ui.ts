import { create } from 'zustand';

interface UIStore {
  speed: number;
  showTimeline: boolean;
  showDashboard: boolean;
  selectedTick: number | null;
  setSpeed: (speed: number) => void;
  toggleTimeline: () => void;
  toggleDashboard: () => void;
  setSelectedTick: (tick: number | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  speed: 1,
  showTimeline: true,
  showDashboard: true,
  selectedTick: null,
  setSpeed: (speed) => set({ speed }),
  toggleTimeline: () => set((s) => ({ showTimeline: !s.showTimeline })),
  toggleDashboard: () => set((s) => ({ showDashboard: !s.showDashboard })),
  setSelectedTick: (tick) => set({ selectedTick: tick }),
}));
