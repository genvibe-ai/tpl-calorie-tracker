import type { ComponentProps, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { palette } from "@/constants/content";

export type SurfaceProps = PropsWithChildren<{
  style?: ComponentProps<typeof Animated.View>["style"];
  /** Liquid Glass reacts to touches (iOS 26+). */
  interactive?: boolean;
  material?: "clear" | "regular";
  visible?: boolean;
  /** Seconds the glass takes to form or dissolve (iOS 26+). */
  materialize?: number;
}>;

/**
 * The surface wherever Liquid Glass is unavailable (Android, the web, iOS
 * before 26 or with Reduce Transparency): a soft cream card.
 */
export function PlainSurface({ children, style, visible = true }: SurfaceProps) {
  return (
    <Animated.View
      style={[
        {
          backgroundColor: palette.glassFallback,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.line,
          boxShadow: "0 4px 16px rgba(44, 38, 32, 0.07)",
          opacity: visible ? 1 : 0,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
