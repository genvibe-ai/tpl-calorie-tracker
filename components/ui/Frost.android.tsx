/** Android: a translucent paper veil instead of a live blur (cheap, and steady in Expo Go). */
import { View, type StyleProp, type ViewStyle } from "react-native";
import { palette } from "@/constants/content";
import { withAlpha } from "@/lib/color";

export function Frost({ intensity, style }: { intensity: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: withAlpha(palette.paper, Math.min(0.9, 0.4 + intensity / 130)) }, style]} />;
}
