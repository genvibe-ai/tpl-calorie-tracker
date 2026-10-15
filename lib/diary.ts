/**
 * Diary logic: local dates, totals, the companion's mood, the local answers in
 * the chat, and the sample diary built from constants/content.ts.
 */
import {
  copy,
  everydayMeals,
  goals,
  mealTypes,
  sampleDiary,
  sampleMeals,
  type MealType,
  type SampleMealId,
} from "@/constants/content";

export { mealTypes, type MealType };

/** A bundled sample photo (`sample`) or a photo the person picked (`uri`). */
export type MealPhoto = { uri?: string; sample?: SampleMealId };

export type Meal = {
  id: string;
  /** Local day, YYYY-MM-DD. */
  date: string;
  name: string;
  type: MealType;
  kcal: number;
  /** Grams. Known for sample meals; photos people pick only get a calorie amount. */
  protein?: number;
  carbs?: number;
  fat?: number;
  photo?: MealPhoto;
  time: string;
};

export type Macro = "protein" | "carbs" | "fat";

/** Stored diaries can mention sample meals that content.ts no longer has. */
export function isSampleMeal(id: unknown): id is SampleMealId {
  return typeof id === "string" && id in sampleMeals;
}

/** Local dates: a meal close to midnight must not move into another day. */
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
export function relativeDay(offset: number, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return dayKey(d);
}
export function clockTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
export function mealsOn(meals: Meal[], date: string) {
  return meals.filter((meal) => meal.date === date);
}
export function totalOn(meals: Meal[], date: string) {
  return mealsOn(meals, date).reduce((sum, meal) => sum + meal.kcal, 0);
}
/** A reaction to the log, never a judgment about nutrition or the person. */
export function intakeMood(total: number, guide: number): -1 | 0 | 1 {
  if (!total) return 0;
  return total > guide ? 1 : total < guide * 0.4 ? -1 : 0;
}
/** Monday-first month grid; null for the blank leading and trailing cells. */
export function monthCells(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const size = Math.ceil((offset + count) / 7) * 7;
  return Array.from({ length: size }, (_, i) => {
    const day = i - offset + 1;
    return day < 1 || day > count ? null : dayKey(new Date(year, month, day, 12));
  });
}
export function dayCaption(date: string) {
  if (date === dayKey()) return "Today";
  if (date === relativeDay(-1)) return "Yesterday";
  return parseDay(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type IntakeAnswer = {
  value?: string;
  unit?: string;
  macro?: Macro;
  caption: string;
  detail: string;
};

/** Local answers built from the diary's actual values; no model, no network. */
export function answerAbout(question: string, meals: Meal[], guide: number): IntakeAnswer {
  const q = question.toLowerCase();
  // A weekly question must work even when nothing has been logged today.
  if (/week/.test(q)) {
    const days = Array.from({ length: 7 }, (_, i) => relativeDay(-i));
    const total = meals.filter((meal) => days.includes(meal.date)).reduce((sum, meal) => sum + meal.kcal, 0);
    const logged = days.filter((day) => mealsOn(meals, day).length).length;
    return {
      value: total.toLocaleString(),
      unit: "kcal",
      caption: copy.answers.week(logged),
      detail: copy.answers.weekDetail,
    };
  }
  const date = q.includes("yesterday") ? relativeDay(-1) : dayKey();
  const items = mealsOn(meals, date);
  const total = totalOn(meals, date);
  const when = date === dayKey() ? "Today" : "Yesterday";
  if (!items.length) return { caption: when, detail: copy.answers.nothingYet };

  const macro: Macro | null = /protein/.test(q)
    ? "protein"
    : /carb/.test(q)
      ? "carbs"
      : /\bfats?\b/.test(q)
        ? "fat"
        : null;
  if (macro) {
    const known = items.filter((meal) => meal[macro] !== undefined);
    const grams = known.reduce((sum, meal) => sum + (meal[macro] ?? 0), 0);
    return known.length
      ? {
          value: String(grams),
          unit: "g",
          macro,
          caption: `${copy.answers.macroCaption(when)} · goal ${goals[macro]} g`,
          detail: known.length < items.length ? copy.answers.macroPartial : copy.answers.macroFull,
        }
      : {
          macro,
          caption: copy.answers.macroNone(when, macro),
          detail: copy.answers.macroNoneDetail,
        };
  }
  if (/left|remaining|guide|goal|over|too much/.test(q)) {
    const over = total > guide;
    return {
      value: total.toLocaleString(),
      unit: "kcal",
      caption: copy.answers.guide(when, Math.abs(guide - total).toLocaleString(), over),
      detail: over ? copy.answers.overGuide : copy.answers.underGuide,
    };
  }
  if (/breakfast|lunch|dinner|snack/.test(q)) {
    const type = mealTypes.find((type) => q.includes(type.toLowerCase()))!;
    const chosen = items.filter((meal) => meal.type === type);
    return chosen.length
      ? {
          value: chosen.reduce((sum, meal) => sum + meal.kcal, 0).toLocaleString(),
          unit: "kcal",
          caption: `${when} · ${type.toLowerCase()}`,
          detail: chosen.map((meal) => meal.name).join(" + "),
        }
      : { caption: `${when} · ${type.toLowerCase()}`, detail: copy.answers.typeNone };
  }
  return {
    value: total.toLocaleString(),
    unit: "kcal",
    caption: copy.answers.dayCaption(when, items.length),
    detail: total > guide ? copy.answers.overGuide : copy.answers.goodStart,
  };
}

/** A meal entry for a bundled sample photo. */
export function sampleMeal(id: SampleMealId, fields: Pick<Meal, "id" | "date" | "type" | "time">): Meal {
  const s = sampleMeals[id];
  return { ...fields, name: s.name, kcal: s.kcal, protein: s.protein, carbs: s.carbs, fat: s.fat, photo: { sample: id } };
}

const MEAL_TIMES: Record<MealType, string> = {
  Breakfast: "8:40 AM",
  Lunch: "1:05 PM",
  Snack: "4:15 PM",
  Dinner: "7:30 PM",
};

/**
 * Ten days of history plus today's sample breakfast and lunch. Built from
 * content.ts by meal type, so renamed or new sample meals just work. Sample
 * entries carry ids starting with "demo-".
 */
export function demoMeals(base = new Date()): Meal[] {
  const ids = Object.keys(sampleMeals) as SampleMealId[];
  const photosOf = (type: MealType) => ids.filter((id) => sampleMeals[id].mealType === type);
  const plainOf = (type: MealType) => everydayMeals.filter((meal) => meal.mealType === type);
  const meals: Meal[] = [];
  for (let i = 1; i <= 10; i++) {
    const date = relativeDay(-i, base);
    const types: MealType[] = i % 3 === 0 ? ["Breakfast", "Lunch", "Snack", "Dinner"] : ["Breakfast", "Lunch", "Dinner"];
    types.forEach((type, t) => {
      const photos = photosOf(type);
      const plain = plainOf(type);
      const turn = Math.floor(i / 2) + t;
      const fields = { id: `demo-${i}-${type}`, date, type, time: MEAL_TIMES[type] };
      if (photos.length && ((i + t) % 2 === 0 || !plain.length)) {
        meals.push(sampleMeal(photos[turn % photos.length], fields));
      } else if (plain.length) {
        const meal = plain[turn % plain.length];
        meals.push({ ...fields, name: meal.name, kcal: meal.kcal });
      }
    });
  }
  sampleDiary.today.filter(isSampleMeal).forEach((id, i) => {
    const type = sampleMeals[id].mealType;
    meals.push(sampleMeal(id, { id: `demo-today-${i}`, date: dayKey(base), type, time: MEAL_TIMES[type] }));
  });
  return meals;
}

/** Changes whenever the sample meals or the goal in content.ts change, so the sample diary refreshes. */
export const SAMPLE_KEY = (() => {
  const text = JSON.stringify(
    [sampleMeals, everydayMeals, sampleDiary.today, goals.dailyKcal],
    (key, value) => (key === "image" ? undefined : value),
  );
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
})();
