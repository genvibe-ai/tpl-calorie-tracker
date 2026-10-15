/**
 * The food diary: a month of meal stickers, the selected day's total against
 * the daily guide, and that day's meals as stickers to edit.
 */
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { copy, palette } from "@/constants/content";
import { dayCaption, dayKey, intakeMood, mealsOn, monthCells, parseDay, totalOn, type Meal } from "@/lib/diary";
import { haptics } from "@/lib/haptics";
import type { Scene } from "@/hooks/useScene";
import { FoodSticker, MealSticker, StickerArrival } from "./Stickers";
import { Frost } from "./ui/Frost";
import { GlassButton } from "./ui/GlassButton";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./ui/Icon";
import { Touch } from "./ui/Touch";

/** "52 g protein · 140 g carbs · 38 g fat" for the meals that have estimates. */
function macroLine(items: Meal[]) {
  const sum = (key: "protein" | "carbs" | "fat") => items.reduce((total, meal) => total + (meal[key] ?? 0), 0);
  if (!items.some((meal) => meal.protein !== undefined)) return "";
  return `${sum("protein")} g protein · ${sum("carbs")} g carbs · ${sum("fat")} g fat`;
}

export function CalorieCalendar({
  scene,
  open,
  meals,
  guide,
  onClose,
  onAdd,
  onEdit,
  onGuide,
}: {
  scene: Scene;
  open: boolean;
  meals: Meal[];
  guide: number;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (meal: Meal) => void;
  onGuide: () => void;
}) {
  const today = dayKey();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.2;
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => new Date());
  const cells = useMemo(() => monthCells(month.getFullYear(), month.getMonth()), [month]);
  const items = mealsOn(meals, selected);
  const total = totalOn(meals, selected);
  const macros = macroLine(items);
  const { pick, reduced, expression } = scene;
  useEffect(() => {
    if (open) expression.set(withTiming(intakeMood(total, guide), { duration: 220 }));
  }, [open, total, guide, expression]);
  const panelTop = Math.max(180, scene.height - 616);
  const slide = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: reduced
          ? pick.get() < 0.01
            ? scene.height
            : 0
          : (1 - pick.get()) * (scene.height - panelTop + 20),
      },
    ],
  }));
  const veil = useAnimatedStyle(() => ({ opacity: Math.max(0, Math.min(1, pick.get())) }));
  const closeControl = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - pick.get()) * -130 }] }));
  const stepMonth = (direction: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1, 12);
    setMonth(next);
    setSelected(today.startsWith(dayKey(next).slice(0, 7)) ? today : dayKey(next));
    haptics.select();
  };
  return (
    <View
      pointerEvents={open ? "box-none" : "none"}
      accessibilityViewIsModal={open}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={{ position: "absolute", inset: 0, zIndex: 30 }}
    >
      {/* A fixed frost fades in. It is a sibling of the glass, never its parent. */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, veil]}>
        <Frost intensity={65} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View style={[{ position: "absolute", top: scene.top, right: 18 }, closeControl]}>
        <GlassButton name="close" label="Close food diary" onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: panelTop,
            left: 16,
            right: 16,
            height: scene.height - panelTop - scene.bottom - 16,
          },
          slide,
        ]}
      >
        {/* The glass travels with its sheet, offscreen too, so it never re-forms on open. */}
        <GlassSurface style={{ flex: 1, borderRadius: 36 }}>
          <View style={{ flex: 1, borderRadius: 36, overflow: "hidden" }}>
            <ScrollView
              key={fontScale}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30 }}
            >
              <View
                style={{
                  flexDirection: largeText ? "column" : "row",
                  alignItems: largeText ? "stretch" : "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.6}
                  style={{ fontSize: 28, fontWeight: "600", letterSpacing: -0.8, color: palette.ink }}
                >
                  {month.toLocaleDateString("en-US", { month: "long" })}
                  <Text style={{ fontSize: 13, fontWeight: "400", letterSpacing: 0, color: palette.muted }}>
                    {" "}
                    {month.getFullYear()}
                  </Text>
                </Text>
                <View
                  style={{ flexDirection: "row", marginRight: -8, alignSelf: largeText ? "flex-end" : "auto" }}
                >
                  {selected !== today && (
                    <Touch
                      label="Back to today"
                      onPress={() => {
                        setMonth(new Date());
                        setSelected(today);
                      }}
                      style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                    >
                      <Icon name="today" size={16} color={palette.muted} />
                    </Touch>
                  )}
                  <Touch
                    label="Previous month"
                    onPress={() => stepMonth(-1)}
                    style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}
                  >
                    <Icon name="back" size={15} color={palette.ink} />
                  </Touch>
                  <Touch
                    label="Next month"
                    onPress={() => stepMonth(1)}
                    style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}
                  >
                    <Icon name="forward" size={15} color={palette.ink} />
                  </Touch>
                </View>
              </View>
              <View style={{ flexDirection: "row", height: 22 }}>
                {copy.calendar.weekdays.map((day, i) => (
                  <Text
                    key={i}
                    maxFontSizeMultiplier={1.8}
                    style={{ flex: 1, textAlign: "center", color: palette.faint, fontSize: 11 }}
                  >
                    {day}
                  </Text>
                ))}
              </View>
              <View>
                {Array.from({ length: Math.ceil(cells.length / 7) }, (_, row) => (
                  <View key={row} style={{ flexDirection: "row" }}>
                    {cells.slice(row * 7, row * 7 + 7).map((day, column) => {
                      const i = row * 7 + column;
                      const logged = day ? mealsOn(meals, day) : [];
                      const food = logged.length ? logged[parseDay(day!).getDate() % logged.length] : undefined;
                      return (
                        <View key={day ?? `blank-${i}`} style={{ flex: 1, height: 48, alignItems: "center" }}>
                          {day && (
                            <Touch
                              label={`${dayCaption(day)}, ${totalOn(meals, day)} kilocalories`}
                              onPress={() => {
                                setSelected(day);
                                haptics.select();
                              }}
                              style={{ width: 44, height: 47, alignItems: "center", justifyContent: "center" }}
                            >
                              {selected === day && (
                                <GlassSurface
                                  interactive
                                  materialize={0}
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: 44,
                                    height: 47,
                                    borderRadius: 14,
                                  }}
                                />
                              )}
                              {food ? (
                                <>
                                  <MealSticker meal={food} size={34} angle={((i % 3) - 1) * 8} />
                                  <Text
                                    maxFontSizeMultiplier={1.8}
                                    style={{ fontSize: 10, fontWeight: "500", marginTop: -6, color: palette.ink }}
                                  >
                                    {parseDay(day).getDate()}
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  maxFontSizeMultiplier={1.8}
                                  style={{
                                    fontSize: 15,
                                    fontWeight: day === today ? "600" : "400",
                                    color: day > today ? palette.future : palette.ink,
                                  }}
                                >
                                  {parseDay(day).getDate()}
                                </Text>
                              )}
                            </Touch>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={{ height: 0.5, backgroundColor: palette.line, marginTop: 12, marginBottom: 14 }} />
              <View
                style={{
                  flexDirection: largeText ? "column" : "row",
                  alignItems: largeText ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: largeText ? 8 : 0,
                }}
              >
                <View>
                  <Text style={{ color: palette.muted, fontSize: 12 }}>{dayCaption(selected)}</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                    <Text
                      accessibilityLabel={`${total} kilocalories logged`}
                      maxFontSizeMultiplier={1.8}
                      style={{
                        fontSize: 43,
                        lineHeight: 51,
                        fontWeight: "500",
                        letterSpacing: -1.8,
                        fontVariant: ["tabular-nums"],
                        color: palette.ink,
                      }}
                    >
                      {total.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 14, color: palette.muted }}>{copy.calendar.unit}</Text>
                  </View>
                </View>
                <Touch
                  label="Edit daily calorie guide"
                  onPress={onGuide}
                  style={{ minHeight: 55, alignItems: "flex-end", justifyContent: "center", gap: 7 }}
                >
                  <View style={{ flexDirection: "row", gap: 3 }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <View
                        key={i}
                        style={{
                          width: 4,
                          height: 18,
                          borderRadius: 2,
                          backgroundColor:
                            i < Math.round(Math.min(1, total / guide) * 12)
                              ? total > guide
                                ? palette.caramel
                                : palette.sage
                              : palette.line,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: palette.muted }}>
                    {copy.calendar.guide(guide.toLocaleString())}
                  </Text>
                </Touch>
              </View>
              {macros ? (
                <Text style={{ fontSize: 12, color: palette.muted, marginTop: 2, fontVariant: ["tabular-nums"] }}>
                  {macros}
                </Text>
              ) : null}
              {items.length ? (
                <Animated.View
                  key={selected}
                  entering={FadeIn.duration(120)}
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 6,
                    paddingBottom: 3,
                  }}
                >
                  {items.map((meal, i) => (
                    <View key={meal.id} style={{ width: "33.333%", alignItems: "center" }}>
                      <StickerArrival
                        index={i}
                        offset={9}
                        spread={((Math.min(items.length, 3) - 1) / 2 - (i % 3)) * 32}
                      >
                        <Touch
                          label={`Edit ${meal.name}, ${meal.kcal} kilocalories`}
                          onPress={() => onEdit(meal)}
                          style={{ minHeight: 100, alignItems: "center" }}
                        >
                          <MealSticker meal={meal} size={90} angle={[-9, 5, -3][i % 3]} />
                          <View
                            style={{
                              marginTop: -7,
                              paddingHorizontal: 9,
                              paddingVertical: 3,
                              borderRadius: 5,
                              backgroundColor: palette.sticker,
                              transform: [{ rotate: `${i % 2 ? 3 : -3}deg` }],
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: "500", color: palette.ink }}>{meal.kcal}</Text>
                          </View>
                        </Touch>
                      </StickerArrival>
                    </View>
                  ))}
                </Animated.View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", minHeight: 105, gap: 8 }}>
                  <View style={{ opacity: 0.35 }}>
                    <FoodSticker kind="Breakfast" size={100} angle={-7} />
                  </View>
                  {selected === today ? (
                    <Touch label="Log a meal from the diary" onPress={onAdd} expand>
                      <GlassSurface
                        interactive
                        style={{
                          height: 44,
                          borderRadius: 22,
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Icon name="add" size={17} color={palette.ink} />
                        <Text style={{ fontSize: 14, color: palette.ink }}>{copy.calendar.firstBite}</Text>
                      </GlassSurface>
                    </Touch>
                  ) : (
                    <Text style={{ fontSize: 15, color: palette.muted }}>{copy.calendar.blankDay}</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}
