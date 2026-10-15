import { useEffect, useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { brand, copy, palette } from "@/constants/content";
import type { Scene } from "@/hooks/useScene";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./ui/Icon";
import { Touch } from "./ui/Touch";

const MAX_LENGTH = 2000;

/** The message field with photo, diary and send controls, on one glass surface. */
export function Composer({
  scene,
  busy,
  onSend,
  onStop,
  onPhoto,
  onCalendar,
  onHeight,
  onFocusChange,
}: {
  scene: Scene;
  busy: boolean;
  onSend: (text: string) => Promise<boolean>;
  onStop: () => void;
  onPhoto: () => void;
  onCalendar: () => void;
  onHeight: (height: number) => void;
  /** Web only: native builds follow the keyboard instead. */
  onFocusChange?: (focused: boolean) => void;
}) {
  const input = useRef<TextInput>(null);
  const value = useRef("");
  const sending = useRef(false);
  const [textHeight, setTextHeight] = useState(42);
  const [text, setText] = useState("");
  const hasText = !!text.trim();
  const { composerWidth, composerHeight, reduced } = scene;
  useEffect(() => {
    const targetHeight = Math.max(108, textHeight + 62);
    composerWidth.set(scene.width - 32);
    composerHeight.set(withTiming(targetHeight, { duration: reduced ? 0 : 160 }));
    onHeight(targetHeight);
  }, [composerHeight, composerWidth, scene.width, reduced, textHeight, onHeight]);
  const surface = useAnimatedStyle(() => ({
    width: composerWidth.get(),
    height: composerHeight.get(),
    borderRadius: 28,
  }));
  const submit = async () => {
    const message = value.current.trim().slice(0, MAX_LENGTH);
    if (sending.current || !message) return;
    sending.current = true;
    try {
      if (await onSend(message)) {
        value.current = "";
        input.current?.clear();
        setText("");
      }
    } finally {
      sending.current = false;
    }
  };
  const web = Platform.OS === "web";
  // Keep the field and actions in the same layout throughout keyboard travel.
  // Focus must not trigger a React commit or rearrange these controls.
  return (
    <GlassSurface
      interactive
      style={[{ paddingHorizontal: 4, paddingTop: 12, paddingBottom: 4, justifyContent: "center" }, surface]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44 }}>
        <TextInput
          ref={input}
          value={text}
          accessibilityLabel={`Message ${brand.name}`}
          placeholder={copy.composer.placeholder}
          placeholderTextColor={palette.faint}
          keyboardAppearance="light"
          autoCapitalize="sentences"
          maxLength={MAX_LENGTH}
          multiline
          scrollEnabled={textHeight >= 112}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
          onFocus={web ? () => onFocusChange?.(true) : undefined}
          onBlur={web ? () => onFocusChange?.(false) : undefined}
          onLayout={(event) => setTextHeight(Math.max(42, Math.min(112, event.nativeEvent.layout.height)))}
          onChangeText={(next) => {
            if (sending.current) return;
            value.current = next;
            setText(next);
            scene.typing.set(1);
          }}
          selectionColor={palette.accent}
          style={{
            flex: 1,
            fontSize: 17,
            lineHeight: 23,
            color: palette.ink,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minHeight: 42,
            maxHeight: 112,
            // No browser focus ring inside the glass.
            ...(web ? { outlineWidth: 0 } : null),
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Touch
            label="Add meal photo"
            onPress={onPhoto}
            expand
            style={{ width: 46, height: 46, justifyContent: "center", alignItems: "center" }}
          >
            <Icon name="camera" size={21} color={palette.ink} />
          </Touch>
          <Touch
            label="Open food diary"
            onPress={onCalendar}
            style={{ minHeight: 44, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Icon name="calendar" size={15} color={palette.muted} />
            <Text style={{ color: palette.muted, fontSize: 14 }}>{copy.composer.today}</Text>
          </Touch>
        </View>
        <Touch
          label={busy ? "Stop response" : "Send message"}
          onPress={
            busy
              ? onStop
              : () => {
                  if (hasText) void submit();
                }
          }
          expand
          style={{ width: 46, height: 46, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: palette.heavy,
              opacity: hasText || busy ? 1 : 0.22,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Icon name={busy ? "stop" : "send"} size={busy ? 11 : 18} color={palette.onHeavy} />
          </View>
        </Touch>
      </View>
    </GlassSurface>
  );
}
