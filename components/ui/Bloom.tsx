import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

// exp(-(2t)^2): a soft, Gaussian-looking falloff from the centre to the edge.
const FALLOFF = [
  [0, 1],
  [0.15, 0.914],
  [0.3, 0.698],
  [0.45, 0.445],
  [0.6, 0.237],
  [0.75, 0.105],
  [0.9, 0.039],
  [1, 0],
] as const;

/**
 * A soft elliptical pool of light filling width x height. `id` must be unique
 * on screen (the web build shares one SVG id space).
 */
export function Bloom({
  id,
  color,
  width,
  height,
  peak = 1,
}: {
  id: string;
  color: string;
  width: number;
  height: number;
  peak?: number;
}) {
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {FALLOFF.map(([offset, alpha]) => (
            <Stop key={offset} offset={offset} stopColor={color} stopOpacity={alpha * peak} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}
