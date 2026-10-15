import { Text, View } from "react-native";
import { copy, palette } from "@/constants/content";
import type { IntakeAnswer, Macro } from "@/lib/diary";
import { FoodSticker, type StickerKind } from "./Stickers";

const MACRO_STICKER: Record<Macro, StickerKind> = { protein: "Protein", carbs: "Breakfast", fat: "Lunch" };
const MACRO_LABEL: Record<Macro, string> = { protein: "Protein", carbs: "Carbs", fat: "Fat" };

/** A reply as a picture: a sticker, one big number and a few words. */
export function VisualAnswer({ answer }: { answer: IntakeAnswer }) {
  const labels = copy.answers.labels;
  return (
    <View
      accessible
      accessibilityLabel={[answer.value && `${answer.value} ${answer.unit}`, answer.caption, answer.detail]
        .filter(Boolean)
        .join(". ")}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: -8 }}>
        <FoodSticker
          kind={answer.macro ? MACRO_STICKER[answer.macro] : "Lunch"}
          size={118}
          angle={answer.macro ? 7 : -5}
        />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ color: palette.muted, fontSize: 13 }}>
            {answer.macro ? MACRO_LABEL[answer.macro] : answer.value ? labels.log : labels.fresh}
          </Text>
          {answer.value ? (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontSize: 52,
                  lineHeight: 62,
                  fontWeight: "500",
                  letterSpacing: -2.2,
                  color: palette.ink,
                  flexShrink: 1,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {answer.value}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 18 }}>{answer.unit}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 20, lineHeight: 25, color: palette.ink, marginTop: 8 }}>
              {answer.macro ? labels.noEstimate : labels.nothing}
            </Text>
          )}
          <Text style={{ fontSize: 12, lineHeight: 17, color: palette.muted }}>{answer.caption}</Text>
        </View>
      </View>
      {answer.value && answer.detail ? (
        <Text style={{ fontSize: 17, lineHeight: 23, color: palette.ink, marginTop: 6 }}>{answer.detail}</Text>
      ) : null}
    </View>
  );
}
