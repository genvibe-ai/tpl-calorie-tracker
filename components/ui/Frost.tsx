/** iOS and web: a frosted backdrop (UIVisualEffectView / CSS backdrop-filter). Android uses Frost.android.tsx. */
import type { StyleProp, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

export function Frost({ intensity, style }: { intensity: number; style?: StyleProp<ViewStyle> }) {
  return <BlurView tint="light" intensity={intensity} style={style} />;
}
