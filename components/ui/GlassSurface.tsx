/**
 * Android and web: Liquid Glass is iOS-only, so every glass surface is a
 * plain cream card. iOS uses GlassSurface.ios.tsx.
 */
export { PlainSurface as GlassSurface, type SurfaceProps } from "./PlainSurface";

export function useNativeGlass() {
  return false;
}
