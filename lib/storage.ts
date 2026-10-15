/**
 * iOS and Android: the diary is one JSON file in the app's documents folder.
 * Reads are synchronous, so the diary is there on the first frame.
 * The web build uses storage.web.ts (localStorage) instead.
 */
import { File, Paths } from "expo-file-system";
import type { StateStorage } from "zustand/middleware";

const fileFor = (key: string) => new File(Paths.document, `${key}.json`);

export const diaryStorage: StateStorage = {
  getItem: (key) => {
    try {
      const file = fileFor(key);
      return file.exists ? file.textSync() : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      fileFor(key).write(value);
    } catch {
      // A full disk must not break logging; the next change tries again.
    }
  },
  removeItem: (key) => {
    try {
      const file = fileFor(key);
      if (file.exists) file.delete();
    } catch {
      // Nothing to remove.
    }
  },
};

/** Copies a picked photo into the documents folder so it outlives the picker's cache. */
export async function keepPhoto(uri: string, name: string) {
  const extension = uri.split(".").pop()?.split("?")[0] || "jpg";
  const local = new File(Paths.document, `${name}.${extension}`);
  await new File(uri).copy(local);
  return local.uri;
}
