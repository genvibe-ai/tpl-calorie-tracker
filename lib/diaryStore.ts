/**
 * The food diary: meals and the daily calorie guide, saved on the device
 * (lib/storage.ts). Read it in components with `useDiary((s) => s.meals)`
 * and change it from event handlers with `useDiary.getState().add(meal)`.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { goals, sampleDiary } from "@/constants/content";
import { SAMPLE_KEY, demoMeals, type Meal } from "./diary";
import { diaryStorage } from "./storage";

export type Diary = {
  meals: Meal[];
  guide: number;
  /** Which version of the sample meals is in the diary. */
  sampleKey?: string;
  add: (meal: Meal) => void;
  edit: (id: string, fields: Pick<Meal, "name" | "kcal">) => void;
  remove: (id: string) => void;
  setGuide: (guide: number) => void;
  /** Replaces the whole diary with the sample one. */
  seedDemo: () => void;
};

export const useDiary = create<Diary>()(
  persist(
    (set) => ({
      meals: [],
      guide: goals.dailyKcal,
      add: (meal) =>
        set((s) => ({
          meals: s.meals.some((m) => m.id === meal.id) ? s.meals : [...s.meals, meal],
        })),
      edit: (id, fields) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, ...fields } : m)),
        })),
      remove: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
      setGuide: (guide) => set({ guide }),
      seedDemo: () => set({ meals: demoMeals(), guide: goals.dailyKcal, sampleKey: SAMPLE_KEY }),
    }),
    {
      name: "morsel-diary",
      version: 1,
      storage: createJSONStorage(() => diaryStorage),
      partialize: (s) => ({ meals: s.meals, guide: s.guide, sampleKey: s.sampleKey }),
    },
  ),
);

// The storage is synchronous, so the saved diary is already loaded here. On the
// first launch, or after the sample meals in content.ts change, put the sample
// diary in place while keeping every meal the person logged themselves.
if (sampleDiary.seedOnFirstLaunch && useDiary.getState().sampleKey !== SAMPLE_KEY) {
  const own = useDiary.getState().meals.filter((meal) => !meal.id.startsWith("demo-"));
  useDiary.setState({ meals: [...own, ...demoMeals()], guide: goals.dailyKcal, sampleKey: SAMPLE_KEY });
}
