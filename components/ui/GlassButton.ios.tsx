/**
 * iOS 26+: the system's own SwiftUI glass button (@expo/ui), so the press and
 * highlight are native. Anywhere else it falls back to RoundButton.
 */
import { Button, Host, Image } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import { palette } from "@/constants/content";
import { haptics } from "@/lib/haptics";
import { useNativeGlass } from "./GlassSurface";
import { sfSymbol } from "./Icon";
import { RoundButton, type RoundButtonProps } from "./RoundButton";

export type GlassButtonProps = RoundButtonProps;

export function GlassButton(props: RoundButtonProps) {
  const native = useNativeGlass();
  if (!native) return <RoundButton {...props} />;
  const { name, label, onPress, size = 44 } = props;
  return (
    <Host colorScheme="light" ignoreSafeArea="all" style={{ width: size, height: size, overflow: "visible" }}>
      <Button
        onPress={() => {
          haptics.select();
          onPress();
        }}
        modifiers={[
          buttonStyle("glass"),
          buttonBorderShape("circle"),
          controlSize("large"),
          accessibilityLabel(label),
          foregroundStyle(palette.ink),
        ]}
      >
        <Image systemName={sfSymbol(name)} size={18} modifiers={[frame({ width: size - 30, height: size - 30 })]} />
      </Button>
    </Host>
  );
}
