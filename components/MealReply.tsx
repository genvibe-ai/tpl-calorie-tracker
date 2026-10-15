/**
 * The meal reply: four meal-type stickers to choose from, then the receipt
 * (photo sticker, name, a big calorie number, macros and a short line). One
 * bubble and one photo identity from the question through the receipt.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { copy, palette, sampleMeals } from "@/constants/content";
import { isSampleMeal, mealTypes, type Meal, type MealType } from "@/lib/diary";
import { EASE } from "@/lib/motion";
import { FoodSticker, MealSticker } from "./Stickers";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./ui/Icon";
import { Touch } from "./ui/Touch";

/** How long the meal choices take to retire before the receipt arrives. */
export const CHOICE_RETIRE_MS = 190;
const AnimateReply = createContext(true);

/** Animates artwork and type only; glass forms with its own material API. */
function useReveal(active: boolean, delay = 0) {
  const reduced = useReducedMotion();
  const animate = useContext(AnimateReply);
  const [visible, setVisible] = useState(active && !animate);
  const progress = useSharedValue(active && !animate ? 1 : 0);
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setVisible(active);
        progress.set(
          withTiming(active ? 1 : 0, {
            duration: !animate ? 0 : reduced ? 100 : active ? 230 : 120,
            easing: EASE,
          }),
        );
      },
      active && !reduced && animate ? delay : 0,
    );
    return () => clearTimeout(timer);
  }, [active, animate, delay, progress, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * 5 }],
  }));
  return { visible, style };
}

function Reveal({ children, active, delay = 0 }: PropsWithChildren<{ active: boolean; delay?: number }>) {
  const reveal = useReveal(active, delay);
  return (
    <Animated.View accessibilityElementsHidden={!reveal.visible} style={reveal.style}>
      {children}
    </Animated.View>
  );
}

/** Short word chunks arrive in order without changing the measured bubble. */
function ReplyCopy({
  text,
  active,
  delay = 0,
  style,
}: {
  text: string;
  active: boolean;
  delay?: number;
  style: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const animate = useContext(AnimateReply);
  const [shown, setShown] = useState(active && !animate ? text : "");
  useEffect(() => {
    if (!active) return;
    const chunks = text.match(/\S+\s*/g) ?? [];
    const timers = (reduced || !animate ? [text] : chunks).map((_, index) =>
      setTimeout(
        () => setShown(reduced || !animate ? text : chunks.slice(0, index + 1).join("")),
        reduced || !animate ? 0 : delay + index * 65,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, animate, delay, reduced, text]);
  const reveal = useReveal(active, delay);
  return (
    <Animated.View accessible={active} accessibilityLabel={text} style={reveal.style}>
      <Text accessible={false} style={[style, { opacity: 0 }]}>
        {text}
      </Text>
      <Text accessible={false} style={[style, { position: "absolute", top: 0, left: 0, right: 0 }]}>
        {shown}
      </Text>
    </Animated.View>
  );
}

function MealChoice({
  type,
  index,
  active,
  onPress,
}: {
  type: MealType;
  index: number;
  active: boolean;
  onPress: () => void;
}) {
  const reveal = useReveal(active, 180 + index * 85);
  return (
    <View style={{ width: "48%" }} accessibilityElementsHidden={!reveal.visible}>
      <Touch label={`Log as ${type.toLowerCase()}`} onPress={onPress} disabled={!active || !reveal.visible} expand>
        <GlassSurface
          interactive
          visible={reveal.visible}
          materialize={0.2}
          style={{ height: 92, borderRadius: 25, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View style={[{ alignItems: "center" }, reveal.style]}>
            <FoodSticker kind={type} size={72} angle={[-7, 6, -4, 8][index]} />
            <Text style={{ marginTop: -5, marginBottom: 8, fontSize: 13, fontWeight: "500", color: palette.ink }}>
              {type}
            </Text>
          </Animated.View>
        </GlassSurface>
      </Touch>
    </View>
  );
}

const MACROS = [
  { key: "protein", label: "protein", color: palette.accent },
  { key: "carbs", label: "carbs", color: palette.caramel },
  { key: "fat", label: "fat", color: palette.sage },
] as const;

/** Protein, carbs and fat as a short receipt line (sample meals carry them). */
function MacroRow({ meal }: { meal: Meal }) {
  const known = MACROS.filter((m) => meal[m.key] !== undefined);
  if (!known.length) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
      {known.map((m) => (
        <View
          key={m.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 11,
            backgroundColor: palette.paper,
          }}
        >
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: m.color }} />
          <Text style={{ fontSize: 11.5, color: palette.ink, fontVariant: ["tabular-nums"] }}>
            {meal[m.key]} g <Text style={{ color: palette.muted }}>{m.label}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

/** One identity and one settled height from meal choices through the estimate. */
export function MealReply(props: ComponentProps<typeof MealReplyBody>) {
  // Recycled, already completed replies render immediately when scrolled back.
  const [settledOnMount] = useState(props.complete);
  return (
    <AnimateReply.Provider value={!settledOnMount}>
      <MealReplyBody {...props} />
    </AnimateReply.Provider>
  );
}

function MealReplyBody({
  prompt,
  selecting,
  meal,
  complete,
  total,
  guide,
  thinking,
  onChoose,
  onEdit,
  onCalendar,
}: {
  prompt: string;
  selecting: boolean;
  meal?: Meal;
  complete: boolean;
  total: number;
  guide: number;
  thinking: ReactNode;
  onChoose: (type: MealType) => void;
  onEdit: () => void;
  onCalendar: () => void;
}) {
  const calendar = useReveal(complete, 460);
  const sample = meal?.photo?.sample;
  const quip =
    total > guide ? copy.receipt.overGuide : isSampleMeal(sample) ? sampleMeals[sample].quip : copy.receipt.saved;
  return (
    <View style={{ minHeight: 240 }}>
      {(!meal || selecting) && (
        <View style={meal ? { position: "absolute", top: 0, left: 0, right: 0 } : undefined}>
          <ReplyCopy
            text={prompt}
            active={!selecting}
            delay={60}
            style={{ fontSize: 23, lineHeight: 28, fontWeight: "500", letterSpacing: -0.25, color: palette.ink }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {mealTypes.map((type, index) => (
              <MealChoice
                key={type}
                type={type}
                index={index}
                active={!selecting}
                onPress={() => onChoose(type)}
              />
            ))}
          </View>
        </View>
      )}
      {meal && (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: -9 }}>
            <Reveal active>
              <MealSticker meal={meal} size={142} angle={-7} />
            </Reveal>
            <View style={{ flex: 1, marginLeft: -1, minHeight: 130, justifyContent: "center" }}>
              {!complete && (
                <View style={{ position: "absolute", left: 12 }}>
                  <Reveal active delay={120}>
                    {thinking}
                  </Reveal>
                </View>
              )}
              <Touch
                label={`Edit ${meal.name}, ${meal.kcal} estimated kilocalories`}
                disabled={!complete}
                onPress={onEdit}
              >
                <ReplyCopy
                  text={meal.name}
                  active={complete}
                  style={{ fontSize: 14, lineHeight: 18, color: palette.muted, marginBottom: 2 }}
                />
                <Reveal active={complete} delay={100}>
                  <Text
                    accessibilityLabel={`${meal.kcal} estimated kilocalories`}
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    style={{
                      fontSize: meal.kcal >= 10000 ? 43 : 54,
                      lineHeight: 65,
                      fontWeight: "500",
                      letterSpacing: -2.6,
                      color: palette.ink,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {meal.kcal}
                  </Text>
                </Reveal>
                <Reveal active={complete} delay={210}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    <Text style={{ fontSize: 12, color: palette.muted }}>{copy.receipt.unit}</Text>
                    <Icon name="edit" size={13} color={palette.muted} />
                  </View>
                </Reveal>
              </Touch>
            </View>
          </View>
          <Reveal active={complete} delay={255}>
            <MacroRow meal={meal} />
          </Reveal>
          <View style={{ marginTop: 10 }}>
            <ReplyCopy
              active={complete}
              delay={300}
              text={quip}
              style={{ fontSize: 18, letterSpacing: -0.4, color: palette.ink }}
            />
          </View>
          <View accessibilityElementsHidden={!calendar.visible} style={{ alignSelf: "flex-start", marginTop: 16 }}>
            <Touch label="See your food diary" onPress={onCalendar} disabled={!calendar.visible} expand>
              <GlassSurface
                interactive
                visible={calendar.visible}
                materialize={0.2}
                style={{ height: 44, borderRadius: 22, paddingHorizontal: 16, justifyContent: "center" }}
              >
                <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, calendar.style]}>
                  <Icon name="calendar" size={17} color={palette.ink} />
                  <Text style={{ fontSize: 14, color: palette.ink }}>{copy.receipt.myDay}</Text>
                  <Icon name="open" size={12} color={palette.muted} />
                </Animated.View>
              </GlassSurface>
            </Touch>
          </View>
        </View>
      )}
    </View>
  );
}
