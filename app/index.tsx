import { useLocalSearchParams } from "expo-router";
import { DiaryScreen } from "@/components/DiaryScreen";

/** The diary is the app: no tabs, no back button. `?demo=1` resets it to the sample diary. */
export default function Index() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  return <DiaryScreen key={demo ?? "diary"} demo={demo === "1"} />;
}
