import { palette } from "@/constants/content";
import { GlassSurface } from "./GlassSurface";
import { Icon, type IconName } from "./Icon";
import { Touch } from "./Touch";

export type RoundButtonProps = {
  name: IconName;
  label: string;
  onPress: () => void;
  size?: number;
};

/** A round icon button on a surface. Works on every platform. */
export function RoundButton({ name, label, onPress, size = 44 }: RoundButtonProps) {
  return (
    <Touch label={label} onPress={onPress} expand>
      <GlassSurface
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={name} size={20} color={palette.ink} />
      </GlassSurface>
    </Touch>
  );
}
