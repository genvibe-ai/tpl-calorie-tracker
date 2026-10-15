/**
 * Name and calories for a meal, or the daily guide. An overlay inside the
 * screen (not a Modal), so the keyboard tracking works the same on iOS and
 * Android; Android's back button closes it (DiaryScreen).
 */
import { useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy, palette } from "@/constants/content";
import type { Meal } from "@/lib/diary";
import { useKeyboardPosition } from "@/hooks/useKeyboardPosition";
import { MealSticker } from "./Stickers";
import { Frost } from "./ui/Frost";
import { GlassButton } from "./ui/GlassButton";
import { GlassSurface } from "./ui/GlassSurface";
import { Touch } from "./ui/Touch";

export type EditRequest = {
  name: string;
  meal?: Meal;
  kcal?: number;
  guide?: boolean;
  onSave: (name: string, kcal: number) => void;
  onDelete?: () => void;
};

/** Whole kilocalories from 1 to 10,000, or null. */
function parseKcal(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  const kcal = Number(value);
  return kcal >= 1 && kcal <= 10000 ? kcal : null;
}

export function MealEditor({ request, onClose }: { request: EditRequest; onClose: () => void }) {
  const [name, setName] = useState(request.name);
  const [kcal, setKcal] = useState(request.kcal ? String(request.kcal) : "");
  const [error, setError] = useState("");
  const keyboard = useKeyboardPosition();
  const bottom = useSafeAreaInsets().bottom + 8;
  const position = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.get() + (bottom - 12) * keyboard.progress.get() }],
  }));
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  const save = () => {
    const amount = parseKcal(kcal);
    if (amount === null || (!request.guide && !name.trim())) {
      setError(amount === null ? copy.editor.badAmount : copy.editor.needName);
      return;
    }
    request.onSave(name.trim(), amount);
    close();
  };
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={{ position: "absolute", inset: 0, zIndex: 80 }}
    >
      <Frost intensity={30} style={{ position: "absolute", inset: 0 }} />
      <Animated.View style={[{ position: "absolute", bottom, left: 16, right: 16 }, position]}>
        <GlassSurface style={{ borderRadius: 32, padding: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            {request.meal && (
              <View style={{ marginLeft: -10, marginRight: 3 }}>
                <MealSticker meal={request.meal} size={62} angle={-7} />
              </View>
            )}
            <Text
              accessibilityRole="header"
              style={{ flex: 1, fontSize: 23, fontWeight: "600", letterSpacing: -0.5, color: palette.ink }}
            >
              {request.guide ? copy.editor.guideTitle : request.kcal ? copy.editor.editTitle : copy.editor.newTitle}
            </Text>
            <GlassButton name="close" label="Cancel" size={40} onPress={close} />
          </View>
          {!request.guide && (
            <TextInput
              accessibilityLabel="Meal name"
              placeholder={copy.editor.namePlaceholder}
              placeholderTextColor={palette.faint}
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError("");
              }}
              maxLength={80}
              returnKeyType="next"
              selectionColor={palette.accent}
              style={{
                minHeight: 48,
                fontSize: 18,
                color: palette.ink,
                borderBottomWidth: 0.5,
                borderColor: palette.line,
                marginBottom: 8,
              }}
            />
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              accessibilityLabel={request.guide ? "Daily guide calories" : "Meal calories"}
              placeholder="0"
              placeholderTextColor={palette.faint}
              value={kcal}
              onChangeText={(value) => {
                setKcal(value.replace(/^0+(?=\d)/, ""));
                setError("");
              }}
              keyboardType="number-pad"
              selectTextOnFocus
              maxLength={5}
              selectionColor={palette.accent}
              // minWidth 0 lets the field shrink on the web so "kcal" stays visible.
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 66,
                fontSize: 42,
                color: palette.ink,
                fontVariant: ["tabular-nums"],
              }}
            />
            <Text style={{ fontSize: 18, color: palette.muted }}>{copy.editor.unit}</Text>
          </View>
          {error ? (
            <Text
              accessibilityRole="alert"
              style={{ fontSize: 13, lineHeight: 18, color: palette.danger, marginTop: 6, marginBottom: 14 }}
            >
              {error}
            </Text>
          ) : (
            <View style={{ height: 16 }} />
          )}
          <Touch
            label={request.guide ? copy.editor.saveGuide : copy.editor.saveMeal}
            onPress={save}
            style={{
              height: 50,
              borderRadius: 25,
              backgroundColor: palette.heavy,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: palette.onHeavy }}>
              {request.guide ? copy.editor.saveGuide : copy.editor.saveMeal}
            </Text>
          </Touch>
          {request.onDelete && (
            <Touch
              label={copy.editor.remove}
              onPress={() => {
                request.onDelete?.();
                close();
              }}
              style={{ minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 6 }}
            >
              <Text style={{ color: palette.danger, fontSize: 14 }}>{copy.editor.remove}</Text>
            </Touch>
          )}
        </GlassSurface>
      </Animated.View>
    </Animated.View>
  );
}
