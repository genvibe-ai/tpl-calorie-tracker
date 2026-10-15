import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";

/** Follows the keyboard's current frame on the UI thread (no-op on the web). */
export function useKeyboardPosition() {
  const height = useSharedValue(0);
  const progress = useSharedValue(0);
  useKeyboardHandler(
    {
      onMove: (event) => {
        "worklet";
        height.set(event.height);
        progress.set(event.progress);
      },
      onInteractive: (event) => {
        "worklet";
        height.set(event.height);
        progress.set(event.progress);
      },
      onEnd: (event) => {
        "worklet";
        height.set(event.height);
        progress.set(event.progress);
      },
    },
    [height, progress],
  );
  return { height, progress };
}
