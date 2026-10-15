/**
 * "Try a sample meal": a pretend viewfinder showing one of the bundled sample
 * photos, so the whole logging flow works without camera access. Real camera
 * and library entries use expo-image-picker (DiaryScreen). Rendered inside the
 * screen as an overlay; Android's back button closes it (DiaryScreen).
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy, palette, sampleMeals, type SampleMealId } from "@/constants/content";
import type { MealPhoto } from "@/lib/diary";
import { haptics } from "@/lib/haptics";
import { MealImage } from "@/lib/photos";
import { GlassButton } from "./ui/GlassButton";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./ui/Icon";
import { Touch } from "./ui/Touch";

export function SampleCamera({
  meal,
  libraryPreview,
  onClose,
  onUse,
  onLibrary,
}: {
  meal: SampleMealId;
  /** The photo on the library button. */
  libraryPreview: SampleMealId;
  onClose: () => void;
  onUse: (photo: MealPhoto) => void;
  onLibrary: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const [review, setReview] = useState(false);
  const [ready, setReady] = useState(false);
  const photoWidth = width - 28;
  const photoHeight = Math.min((photoWidth * 4) / 3, height - safe.top - safe.bottom - 190);
  const [point, setPoint] = useState({ x: photoWidth / 2, y: photoHeight / 2 });
  const flash = useSharedValue(0);
  const focus = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const focusStyle = useAnimatedStyle(() => ({
    opacity: focus.get(),
    transform: [{ scale: 1.1 - focus.get() * 0.1 }],
  }));
  const name = sampleMeals[meal].name;
  // The shutter wakes when the photo is on screen; this is a safety net.
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(timer);
  }, []);
  const focusAt = (x: number, y: number) => {
    if (review) return;
    setPoint({ x, y });
    focus.set(withSequence(withTiming(1, { duration: 100 }), withDelay(380, withTiming(0, { duration: 200 }))));
    haptics.select();
  };
  const capture = () => {
    if (!ready) return;
    flash.set(withSequence(withTiming(0.8, { duration: 55 }), withTiming(0, { duration: 130 })));
    setReview(true);
    haptics.medium();
  };
  return (
    <Animated.View
      entering={SlideInDown.duration(320)}
      exiting={SlideOutDown.duration(260)}
      style={{ position: "absolute", inset: 0, zIndex: 70, backgroundColor: palette.paper }}
    >
      <View
        style={{
          marginTop: safe.top + 4,
          paddingHorizontal: 18,
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <GlassButton name="close" label="Close sample camera" onPress={onClose} />
        <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: "500", color: palette.ink }}>
          {review ? copy.camera.review : copy.camera.title}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={review ? `Captured photo of ${name}` : `Sample camera viewfinder. Tap to focus on ${name}`}
        onPress={(e) => focusAt(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        style={{
          marginTop: 18,
          marginHorizontal: 14,
          width: photoWidth,
          height: photoHeight,
          borderRadius: 28,
          overflow: "hidden",
          backgroundColor: palette.photoBackdrop,
        }}
      >
        {/* A soft, blurred copy fills the frame so the whole dish stays in view. */}
        <MealImage
          photo={{ sample: meal }}
          contentFit="cover"
          blurRadius={28}
          transition={0}
          style={{ position: "absolute", inset: 0, transform: [{ scale: 1.2 }], opacity: 0.85 }}
        />
        <MealImage
          photo={{ sample: meal }}
          contentFit="contain"
          transition={0}
          onDisplay={() => {
            if (ready) return;
            setReady(true);
            focusAt(photoWidth / 2, photoHeight / 2);
          }}
          style={{ width: photoWidth, height: photoHeight }}
        />
        {!review && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: point.x - 34,
                top: point.y - 34,
                width: 68,
                height: 68,
                borderRadius: 15,
                borderWidth: 1.25,
                borderColor: palette.accent,
              },
              focusStyle,
            ]}
          />
        )}
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", inset: 0, backgroundColor: "white" }, flashStyle]}
        />
      </Pressable>
      <View
        style={{
          position: "absolute",
          bottom: safe.bottom + 44,
          left: 32,
          right: 32,
          height: 76,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {review ? (
          <>
            <Touch label="Retake meal photo" onPress={() => setReview(false)} expand>
              <GlassSurface
                interactive
                style={{ height: 50, borderRadius: 25, paddingHorizontal: 19, justifyContent: "center" }}
              >
                <Text style={{ fontSize: 16, color: palette.ink }}>{copy.camera.retake}</Text>
              </GlassSurface>
            </Touch>
            <Touch label="Use meal photo" onPress={() => onUse({ sample: meal })} expand>
              <GlassSurface
                interactive
                style={{
                  height: 50,
                  borderRadius: 25,
                  paddingHorizontal: 19,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <Icon name="check" size={17} color={palette.ink} />
                <Text style={{ fontSize: 16, fontWeight: "500", color: palette.ink }}>{copy.camera.use}</Text>
              </GlassSurface>
            </Touch>
          </>
        ) : (
          <>
            <Touch
              label="Open photo library from camera"
              onPress={onLibrary}
              style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  padding: 2,
                  borderRadius: 10,
                  backgroundColor: palette.sticker,
                  transform: [{ rotate: "-5deg" }],
                }}
              >
                <MealImage photo={{ sample: libraryPreview }} contentFit="cover" style={{ flex: 1, borderRadius: 8 }} />
              </View>
            </Touch>
            <Touch
              label={`Take photo of ${name}`}
              onPress={capture}
              expand
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                borderWidth: 2,
                borderColor: palette.ink,
                alignItems: "center",
                justifyContent: "center",
                opacity: ready ? 1 : 0.45,
              }}
            >
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: palette.ink }} />
            </Touch>
            <View style={{ width: 48 }} />
          </>
        )}
      </View>
    </Animated.View>
  );
}
