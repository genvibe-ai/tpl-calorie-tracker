/**
 * Morsel: the brand, colours, copy, sample meals and goals all live in this
 * one file. Rebrand the app by editing the values below; every screen reads
 * from here. Meal photos are in assets/meals/ (JPEG, light background).
 */
import type { ImageSourcePropType } from "react-native";

export const brand = {
  name: "Morsel",
  /** The little bun on screen; used in accessibility labels. */
  companion: "Morsel",
};

/** Whose diary this is. The welcome reads "Good evening, Sam." */
export const user = { name: "Sam" };

/** The light palette used across the app. */
export const palette = {
  paper: "#F6F0E6", // page background, warm cream
  surface: "#FFFDF8", // assistant bubbles and cards
  ink: "#2C2620", // main text
  muted: "#7A7065", // secondary text
  faint: "#A39889", // placeholders, weekday letters
  line: "#2C262014", // hairlines
  accent: "#D0643A", // paprika: thinking dots, text selection
  glow: "#F4CFA4", // warm light gathering under the composer
  heavy: "#2C2620", // send button and your own bubbles
  onHeavy: "#FFFFFF",
  sage: "#86996B", // daily guide bars while under the goal
  caramel: "#C79257", // daily guide bars once over the goal
  danger: "#A2442F", // errors and "Remove meal"
  sticker: "#FFFDF7", // sticker paper and photo frames
  photoBackdrop: "#E9E3D8", // behind meal photos; matches their backgrounds
  glassFallback: "#FFFCF7", // surfaces where Liquid Glass is unavailable (Android, web, iOS < 26)
  future: "#B5AC9F", // calendar days still to come
};

/** The companion's colours (components/Mascot.tsx draws it from shapes). */
export const mascotColors = {
  bodyLight: "#F8C68B",
  body: "#F0B171",
  bodyDark: "#E39752",
  belly: "#D98843",
  crumb: "#FCE7C8", // inside of the bite
  sheen: "#FFE2B8",
  seed: "#FFF4E0",
  eye: "#FFF9EF",
  pupil: "#3A281E",
  cheek: "#EE8C70",
  mouth: "#5E3620",
  shoe: "#8A5A3B",
  sole: "#F3E2CC",
};

/** Daily goals. The calorie goal is the "guide" people can edit in the diary. */
export const goals = { dailyKcal: 2000, protein: 110, carbs: 230, fat: 70 };

export const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export type MealType = (typeof mealTypes)[number];

export type SampleMeal = {
  name: string;
  kcal: number;
  /** Grams. */
  protein: number;
  carbs: number;
  fat: number;
  image: ImageSourcePropType;
  /** The meal the app suggests when this photo is logged. */
  mealType: MealType;
  /** The short line under the receipt. */
  quip: string;
};

/** Bundled sample meals: the sample camera, the sample diary and the receipts use these. */
export const sampleMeals = {
  oats: {
    name: "Berry overnight oats",
    kcal: 430,
    protein: 15,
    carbs: 62,
    fat: 14,
    image: require("../assets/meals/oats.jpg"),
    mealType: "Breakfast",
    quip: "Overnight success.",
  },
  toast: {
    name: "Avocado toast & egg",
    kcal: 420,
    protein: 16,
    carbs: 34,
    fat: 25,
    image: require("../assets/meals/toast.jpg"),
    mealType: "Breakfast",
    quip: "Toast with ambition.",
  },
  smoothie: {
    name: "Pink smoothie bowl",
    kcal: 380,
    protein: 8,
    carbs: 64,
    fat: 11,
    image: require("../assets/meals/smoothie.jpg"),
    mealType: "Snack",
    quip: "Pretty in pink.",
  },
  poke: {
    name: "Salmon poke bowl",
    kcal: 640,
    protein: 34,
    carbs: 70,
    fat: 22,
    image: require("../assets/meals/poke.jpg"),
    mealType: "Lunch",
    quip: "A bowl of good decisions.",
  },
  salad: {
    name: "Grilled chicken salad",
    kcal: 470,
    protein: 39,
    carbs: 16,
    fat: 27,
    image: require("../assets/meals/salad.jpg"),
    mealType: "Dinner",
    quip: "Crunch, recorded.",
  },
  pasta: {
    name: "Tomato basil penne",
    kcal: 710,
    protein: 24,
    carbs: 108,
    fat: 19,
    image: require("../assets/meals/pasta.jpg"),
    mealType: "Dinner",
    quip: "Al dente and accounted for.",
  },
} satisfies Record<string, SampleMeal>;
export type SampleMealId = keyof typeof sampleMeals;

/** The order "Try a sample meal" offers them in, one per visit. */
export const sampleCameraOrder: SampleMealId[] = [
  "pasta",
  "poke",
  "smoothie",
  "salad",
  "toast",
  "oats",
];

/** Everyday meals without photos for the sample history; drawn stickers stand in. */
export const everydayMeals: { name: string; kcal: number; mealType: MealType }[] = [
  { name: "Yogurt & granola", kcal: 340, mealType: "Breakfast" },
  { name: "Roasted veggie bowl", kcal: 560, mealType: "Lunch" },
  { name: "Herb chicken & rice", kcal: 690, mealType: "Dinner" },
  { name: "Apple & almond butter", kcal: 210, mealType: "Snack" },
];

export const sampleDiary = {
  /**
   * Fill the diary with ten days of sample meals the first time the app opens,
   * and refresh them whenever the sample meals above change. Meals people log
   * themselves are always kept. Set to false for an empty first launch.
   */
  seedOnFirstLaunch: true,
  /** Today's sample breakfast and lunch. */
  today: ["oats", "poke"] as SampleMealId[],
};

/** Everything the app says. Functions fill in numbers and names. */
export const copy = {
  greeting: (hour: number) =>
    hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
  logMeal: "Log a meal",
  photoMenu: { camera: "Take a photo", library: "Photo library", sample: "Try a sample meal" },
  composer: { placeholder: "Ask about your day", today: "Today" },
  askMealType: {
    Breakfast: "For breakfast?",
    Lunch: "For lunch?",
    Dinner: "For dinner?",
    Snack: "A little snack?",
    unknown: "Which meal?",
  },
  afterStop: "Which meal was this?",
  receipt: {
    unit: "kcal · estimated",
    myDay: "My day",
    overGuide: "A plot twist. You're fine.",
    saved: "Saved. Nicely done.",
    removed: "Meal removed from your diary.",
  },
  chat: { stopped: "Response stopped." },
  calendar: {
    weekdays: ["M", "T", "W", "T", "F", "S", "S"],
    unit: "kcal",
    guide: (kcal: string) => `guide ${kcal}`,
    firstBite: "First bite",
    blankDay: "A blank page.",
  },
  camera: { title: "Meal photo", review: "Your photo", retake: "Retake", use: "Use photo" },
  editor: {
    guideTitle: "Daily guide",
    editTitle: "Edit meal",
    newTitle: "Your estimate",
    namePlaceholder: "Meal name",
    unit: "kcal",
    saveGuide: "Save guide",
    saveMeal: "Save meal",
    remove: "Remove meal",
    badAmount: "Use 1–10,000 kcal.",
    needName: "Add a meal name.",
  },
  answers: {
    week: (logged: number) => `Last 7 days · ${logged} logged`,
    weekDetail: "Tap me to explore each day.",
    nothingYet: "Nothing logged yet. Let's start with a meal photo.",
    macroCaption: (when: string) => `${when} · estimated`,
    macroFull: "Little fuel. Big plans.",
    macroPartial: "Some meals don't have an estimate yet.",
    macroNone: (when: string, macro: string) => `${when} · ${macro}`,
    macroNoneDetail: "No estimates for these meals yet.",
    guide: (when: string, diff: string, over: boolean) =>
      `${when} · ${diff} ${over ? "above" : "below"} your guide`,
    overGuide: "Plot twist. Still delicious. Be kind to yourself.",
    underGuide: "A guide, not a grade. Listen to your appetite, too.",
    typeNone: "Nothing logged here yet. Add a photo whenever you're ready.",
    dayCaption: (when: string, count: number) => `${when} · ${count} ${count === 1 ? "meal" : "meals"} logged`,
    goodStart: "A good start. Keep today delicious.",
    labels: { log: "Your log", fresh: "A fresh page", noEstimate: "No estimate yet.", nothing: "Nothing logged yet." },
  },
  alerts: {
    cameraTitle: "Camera access",
    cameraBody: "Allow camera access in Settings, or choose a photo from your library.",
    notNow: "Not now",
    openSettings: "Open Settings",
    cameraUnavailable: "Camera unavailable",
    cameraUnavailableBody: "Choose a meal from your photo library on this device.",
    photoUnavailable: "Photo unavailable",
    photoUnavailableBody: "That photo couldn't be opened. Try another one.",
    cancel: "Cancel",
    library: "Photo library",
  },
};
