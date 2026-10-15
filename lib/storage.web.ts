/** Web: the diary lives in localStorage. Private windows may refuse it; the app still works. */
import type { StateStorage } from "zustand/middleware";

const store = () => (typeof localStorage === "undefined" ? null : localStorage);

export const diaryStorage: StateStorage = {
  getItem: (key) => {
    try {
      return store()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      store()?.setItem(key, value);
    } catch {
      // Quota or privacy settings; keep going without saving.
    }
  },
  removeItem: (key) => {
    try {
      store()?.removeItem(key);
    } catch {
      // Nothing to remove.
    }
  },
};

/** The browser already gives the picked photo a usable URI. */
export async function keepPhoto(uri: string, _name: string) {
  return uri;
}
