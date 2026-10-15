/**
 * Android and web: a soft paper-coloured fade at a reading edge (under the
 * header and behind the composer). iOS adds real blur in ProgressiveBlur.ios.tsx.
 */
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { withAlpha } from "@/lib/color";

export function ProgressiveBlur({ height, edge, color }: { height: number; edge: "top" | "bottom"; color: string }) {
  const bottom = edge === "bottom";
  // Without blur, the top fade reaches a little further below the title.
  const size = bottom ? height : height + 18;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, [edge]: 0, height: size }}>
      <LinearGradient
        colors={
          bottom
            ? [withAlpha(color, 0), withAlpha(color, 0.72), withAlpha(color, 0.94)]
            : // Nearly solid behind the title, then a quick fade.
              [withAlpha(color, 0.97), withAlpha(color, 0.9), withAlpha(color, 0)]
        }
        locations={bottom ? [0, 0.45, 1] : [0, 0.62, 1]}
        style={{ position: "absolute", inset: 0 }}
      />
    </View>
  );
}
