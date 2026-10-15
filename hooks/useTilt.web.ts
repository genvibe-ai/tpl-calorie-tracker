import { useSharedValue } from "react-native-reanimated";

/** Web: no motion sensors (browsers ask for permission); the gaze follows touches only. */
export function useTilt() {
  const gravity = useSharedValue({ x: 0, y: 0, z: 0 });
  const turning = useSharedValue({ x: 0, y: 0, z: 0 });
  return { gravity, turning };
}
