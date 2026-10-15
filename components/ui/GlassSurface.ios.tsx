/**
 * iOS: native Liquid Glass (iOS 26+) through expo-glass-effect. The system
 * draws the material, its rim and its shadow; nothing is painted over or
 * under it. Keep glass out of parents with opacity < 1, masks or clipping.
 * Older iOS and Reduce Transparency get the plain surface.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import Animated from "react-native-reanimated";
import { PlainSurface, type SurfaceProps } from "./PlainSurface";

export type { SurfaceProps };

const AnimatedGlass = Animated.createAnimatedComponent(GlassView);
const available = isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

/** True where the system can draw Liquid Glass and transparency is not reduced. */
export function useNativeGlass() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setReduce);
    return () => subscription.remove();
  }, []);
  return available && !reduce;
}

export function GlassSurface(props: SurfaceProps) {
  const native = useNativeGlass();
  if (!native) return <PlainSurface {...props} />;
  const { children, style, interactive = false, material = "regular", visible = true, materialize = 0.16 } = props;
  return (
    <AnimatedGlass
      colorScheme="light"
      glassEffectStyle={{
        style: visible ? material : "none",
        animate: true,
        animationDuration: materialize,
      }}
      isInteractive={interactive}
      style={[{ overflow: "visible", borderCurve: "continuous" }, style]}
    >
      {children}
    </AnimatedGlass>
  );
}
