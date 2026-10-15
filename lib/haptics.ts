/** Haptics that never throw. Skipped on the web, where browsers only log warnings. */
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const run = (feedback: () => Promise<void>) => {
  if (Platform.OS === "web") return;
  feedback().catch(() => {});
};

export const haptics = {
  select: () => run(() => Haptics.selectionAsync()),
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
