import { SensorType, useAnimatedSensor } from "react-native-reanimated";

/**
 * iOS and Android: which way is down (gravity) and how fast the phone turns
 * (gyroscope), so the companion's gaze can lean as the phone tilts. Simulators
 * read zero. The web build uses useTilt.web.ts.
 */
export function useTilt() {
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: "auto" });
  const turning = useAnimatedSensor(SensorType.GYROSCOPE, { interval: "auto" });
  return { gravity: gravity.sensor, turning: turning.sensor };
}
