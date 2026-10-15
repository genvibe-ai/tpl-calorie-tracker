import type { IntakeAnswer, Meal, MealPhoto, MealType } from "./diary";

/** One message in the chat. Conversations reset on relaunch; the diary persists. */
export type Turn = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "photo" | "question" | "meal";
  text?: string;
  photo?: MealPhoto;
  /** The meal type the question suggests for a sample photo. */
  suggested?: MealType;
  mealId?: string;
  pendingMeal?: Meal;
  answer?: IntakeAnswer;
  state?: "thinking" | "choosing" | "confirming" | "complete" | "stopped";
};
