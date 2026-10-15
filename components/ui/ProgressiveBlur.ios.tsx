/**
 * iOS: a reading edge made of blur rather than a fade. Three masked blur
 * strengths, so words visibly soften as they pass under the header or the
 * composer. Android and web use the gradient in ProgressiveBlur.tsx.
 */
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { withAlpha } from "@/lib/color";

const LAYERS = [
  { intensity: 10, fadeStart: 0.66, fadeEnd: 1 },
  { intensity: 28, fadeStart: 0.46, fadeEnd: 0.86 },
  { intensity: 66, fadeStart: 0.24, fadeEnd: 0.64 },
];

export function ProgressiveBlur({ height, edge, color }: { height: number; edge: "top" | "bottom"; color: string }) {
  const reverse = edge === "bottom";
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, [edge]: 0, height }}>
      {LAYERS.map((layer, index) => (
        <MaskedView
          key={index}
          style={{ position: "absolute", inset: 0 }}
          maskElement={
            <LinearGradient
              colors={reverse ? ["transparent", "black", "black"] : ["black", "black", "transparent"]}
              locations={
                reverse ? [1 - layer.fadeEnd, 1 - layer.fadeStart, 1] : [0, layer.fadeStart, layer.fadeEnd]
              }
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView tint="light" intensity={layer.intensity} style={{ flex: 1 }} />
        </MaskedView>
      ))}
      <LinearGradient
        colors={
          reverse
            ? [withAlpha(color, 0), withAlpha(color, 0.4), withAlpha(color, 0.7)]
            : [withAlpha(color, 0.7), withAlpha(color, 0.4), withAlpha(color, 0)]
        }
        locations={reverse ? [0.25, 0.7, 1] : [0, 0.3, 0.75]}
        style={{ position: "absolute", inset: 0 }}
      />
    </View>
  );
}
