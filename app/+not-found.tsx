import { Redirect } from "expo-router";

/** Unknown links open the diary. */
export default function NotFound() {
  return <Redirect href="/" />;
}
