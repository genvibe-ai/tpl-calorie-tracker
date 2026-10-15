import { useEffect, type PropsWithChildren } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { palette } from "@/constants/content";
import type { Meal, MealType } from "@/lib/diary";
import { useMealPhotoSource } from "@/lib/photos";

/** Ink-and-paper food drawings, one per meal type (assets/stickers). */
const artwork = {
  Breakfast: require("../assets/stickers/toast.svg"),
  Lunch: require("../assets/stickers/bowl.svg"),
  Dinner: require("../assets/stickers/pasta.svg"),
  Snack: require("../assets/stickers/orange.svg"),
  Protein: require("../assets/stickers/eggs.svg"),
};
export type StickerKind = MealType | "Protein";

/** A meal as a sticker: its photo as a little instant print, or the drawing for its type. */
export function MealSticker({ meal, size = 100, angle = 0 }: { meal: Meal; size?: number; angle?: number }) {
  const source = useMealPhotoSource(meal.photo);
  if (!source) return <FoodSticker kind={meal.type} size={size} angle={angle} />;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <View
        style={{
          width: size * 0.8,
          padding: size * 0.04,
          paddingBottom: size * 0.12,
          borderRadius: Math.max(3, size * 0.06),
          backgroundColor: palette.sticker,
          boxShadow: "0 2px 6px rgba(44, 38, 32, 0.12)",
        }}
      >
        <Image
          source={source}
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: Math.max(2, size * 0.035),
            backgroundColor: palette.photoBackdrop,
          }}
          contentFit="cover"
          transition={0}
        />
      </View>
    </View>
  );
}

export function FoodSticker({ kind, size = 100, angle = 0 }: { kind: StickerKind; size?: number; angle?: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{ width: size, height: size, transform: [{ rotate: `${angle}deg` }] }}
    >
      <Image source={artwork[kind]} style={{ width: size, height: size }} contentFit="contain" transition={0} />
    </View>
  );
}

/** Each piece lands once, like placing a sticker; nothing oscillates while reading. */
export function StickerArrival({
  children,
  index = 0,
  offset = 12,
  spread = 0,
}: PropsWithChildren<{ index?: number; offset?: number; spread?: number }>) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(index * 35, withSpring(1, { damping: 19, stiffness: 230, mass: 0.65 })));
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.get() * 2),
    transform: [
      { translateY: (1 - p.get()) * offset },
      { translateX: (1 - p.get()) * spread },
      { scale: 0.9 + p.get() * 0.1 },
    ],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
