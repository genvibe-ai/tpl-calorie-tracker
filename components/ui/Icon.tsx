/**
 * Icons: SF Symbols on iOS, Material Symbols on Android and the web, through
 * expo-symbols. Add an icon by adding a line to ICONS with both names.
 */
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { palette } from "@/constants/content";

const ICONS = {
  camera: { ios: "camera", android: "photo_camera" },
  photo: { ios: "photo", android: "image" },
  sample: { ios: "fork.knife", android: "restaurant" },
  compose: { ios: "square.and.pencil", android: "edit_square" },
  close: { ios: "xmark", android: "close" },
  today: { ios: "arrow.counterclockwise", android: "replay" },
  back: { ios: "chevron.left", android: "chevron_left" },
  forward: { ios: "chevron.right", android: "chevron_right" },
  add: { ios: "plus", android: "add" },
  edit: { ios: "pencil", android: "edit" },
  calendar: { ios: "calendar", android: "calendar_today" },
  open: { ios: "arrow.up.right", android: "arrow_outward" },
  check: { ios: "checkmark", android: "check" },
  stop: { ios: "stop.fill", android: "stop" },
  send: { ios: "arrow.up", android: "arrow_upward" },
  copy: { ios: "square.on.square", android: "content_copy" },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

/** The SF Symbol name, for native iOS controls. */
export function sfSymbol(name: IconName): SFSymbol {
  return ICONS[name].ios;
}

export function Icon({
  name,
  size = 20,
  color = palette.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { ios, android } = ICONS[name];
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      style={{ width: size, height: size }}
    />
  );
}
