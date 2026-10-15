import { Platform, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { brand, copy, palette } from "@/constants/content";
import type { Turn } from "@/lib/chat";
import { totalOn, type Meal, type MealType } from "@/lib/diary";
import { EASE } from "@/lib/motion";
import { MealImage } from "@/lib/photos";
import { MealReply } from "./MealReply";
import { Thinking } from "./Thinking";
import { VisualAnswer } from "./VisualAnswer";
import { Icon } from "./ui/Icon";
import { Touch } from "./ui/Touch";

export function ChatTurn({
  turn,
  meals,
  guide,
  reduced,
  onChoose,
  onEdit,
  onCalendar,
}: {
  turn: Turn;
  meals: Meal[];
  guide: number;
  reduced: boolean;
  onChoose: (turn: Turn, type: MealType) => void;
  onEdit: (meal: Meal) => void;
  onCalendar: () => void;
}) {
  return (
    <Animated.View
      key={turn.kind === "text" ? `${turn.id}-${turn.state ?? "sent"}` : turn.id}
      entering={turn.kind === "text" && !reduced ? FadeIn.delay(320).duration(140) : undefined}
      layout={
        (turn.kind === "question" || turn.kind === "meal") && !reduced
          ? LinearTransition.duration(280).easing(EASE)
          : undefined
      }
      style={[
        { marginBottom: turn.role === "user" ? 20 : 24 },
        turn.role === "assistant" && {
          width: turn.state === "thinking" && turn.kind !== "meal" ? 72 : "92%",
          alignSelf: "flex-start",
          backgroundColor: palette.surface,
          borderRadius: 28,
          ...(Platform.OS === "ios" ? { borderCurve: "continuous" as const } : null),
          paddingHorizontal: 20,
          paddingVertical: 19,
          boxShadow: "0 3px 18px rgba(44, 38, 32, 0.05)",
        },
      ]}
    >
      {turn.kind === "photo" ? (
        <View
          style={{
            alignSelf: "flex-end",
            borderRadius: 22,
            padding: 5,
            transform: [{ rotate: "3deg" }],
            backgroundColor: palette.sticker,
            boxShadow: "0 4px 12px rgba(44, 38, 32, 0.1)",
          }}
        >
          <MealImage
            accessibilityLabel="Meal photo"
            photo={turn.photo}
            style={{ width: 196, height: 196, borderRadius: 17, backgroundColor: palette.photoBackdrop }}
            contentFit="cover"
            transition={180}
          />
        </View>
      ) : turn.role === "user" ? (
        <View
          style={{
            alignSelf: "flex-end",
            backgroundColor: palette.heavy,
            paddingHorizontal: 17,
            paddingVertical: 12,
            borderRadius: 24,
            maxWidth: "90%",
          }}
        >
          <Text selectable style={{ fontSize: 17, lineHeight: 24, color: palette.onHeavy }}>
            {turn.text}
          </Text>
        </View>
      ) : turn.kind === "question" && turn.state === "thinking" ? (
        <Thinking />
      ) : turn.kind === "question" || turn.kind === "meal" ? (
        (() => {
          const saved = meals.find((meal) => meal.id === turn.mealId);
          if (turn.kind === "meal" && turn.state === "complete" && !saved)
            return <Text style={{ color: palette.muted, fontSize: 16 }}>{copy.receipt.removed}</Text>;
          const meal = turn.kind === "meal" || turn.state === "confirming" ? (saved ?? turn.pendingMeal) : undefined;
          return (
            <MealReply
              key={turn.id}
              prompt={turn.text ?? copy.askMealType.unknown}
              selecting={turn.state === "confirming"}
              meal={meal}
              complete={turn.state === "complete"}
              total={meal ? totalOn(meals, meal.date) : 0}
              guide={guide}
              thinking={<Thinking />}
              onChoose={(type) => onChoose(turn, type)}
              onEdit={() => {
                if (saved) onEdit(saved);
              }}
              onCalendar={onCalendar}
            />
          );
        })()
      ) : turn.state === "thinking" ? (
        <Thinking />
      ) : (
        <View>
          {turn.answer ? (
            <VisualAnswer answer={turn.answer} />
          ) : (
            <Text selectable style={{ fontSize: 20, lineHeight: 28, letterSpacing: -0.25, color: palette.ink }}>
              {turn.text}
            </Text>
          )}
          {turn.state === "stopped" && (
            <Text style={{ color: palette.muted, marginTop: 10, fontSize: 13 }}>{copy.chat.stopped}</Text>
          )}
          {turn.state === "complete" && (
            <Touch
              label={`Copy ${brand.name}'s answer`}
              onPress={() => void Clipboard.setStringAsync(turn.text ?? "").catch(() => {})}
              style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center", alignSelf: "flex-end" }}
            >
              <Icon name="copy" size={16} color={palette.muted} />
            </Touch>
          )}
        </View>
      )}
    </Animated.View>
  );
}
