/**
 * Storage and state persistence layer for EcoLoop.
 */

const STORAGE_KEY = "ecoloop_state";

const DEFAULT_STATE = {
  onboarded: false,
  answers: {
    commute: "",
    diet: "",
    flights: "",
    energy: "",
    city: ""
  },
  profile: null,
  unchangedStory: "",
  ecoloopStory: "",
  currentWeek: 1,
  xp: 0,
  level: 1,
  streak: 0,
  completedNudgesCount: 0,
  nudges: [],
  history: [],
  customPrompts: {} // Stores overrides to prompt layers
};

export const storage = {
  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(serialized);
      // Ensure nested fields are initialized in case of updates
      return { ...DEFAULT_STATE, ...parsed };
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
      return { ...DEFAULT_STATE };
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  },

  clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { ...DEFAULT_STATE };
    } catch (e) {
      console.error("Failed to clear localStorage", e);
      return { ...DEFAULT_STATE };
    }
  }
};
