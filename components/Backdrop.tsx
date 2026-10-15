/**
 * The page is warm paper lit like a studio backdrop: a soft white light behind
 * the companion and a shadow where it stands. The only colour is the warm glow
 * low behind the composer. While a reply is on its way that glow gathers and a
 * body of light runs along the composer; when the reply arrives one pale wave
 * carries up the page. Pure views and SVG, so it runs the same on iOS,
 * Android and the web.
 */
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { palette } from "@/constants/content";
import { mix, withAlpha } from "@/lib/color";
import { FIGURE, type Scene } from "@/hooks/useScene";
import { Bloom } from "./ui/Bloom";

const HALO = 164; // radius of the light behind the companion at full size
const HALO_W = HALO * 4;
const HALO_H = HALO * 0.92 * 4;
const GLOW_RY = 96; // the warm glow's height radius at rest
const RUN_RX = 72;
const RUN_RY = 24;
const BREATH_RY = 34;
const WAVE_H = 256;
const UNIT = FIGURE.hero / 42; // shadow size unit at full size
const SHADOW_W = 19 * UNIT * 4;
const SHADOW_H = 4.6 * UNIT * 4;
const CORE_W = 12 * UNIT * 3.4;
const CORE_H = 2.4 * UNIT * 3.4;

export function Backdrop({ scene }: { scene: Scene }) {
  const { width, height, bottom, reduced } = scene;
  const { figure, feetX, feetY, composerHeight, composerWidth, dockY, energy, spin, release, perch, pick } = scene;
  const glowW = width * 0.6 * 4;
  const breathRX = (width / 2) * 1.1;
  const light = mix(palette.glow, "#FFFFFF", 0.3);
  const wave = mix("#FFFFFF", palette.glow, 0.25);

  const halo = useAnimatedStyle(() => {
    const f = figure.get();
    const settle = Math.max(perch.get(), pick.get());
    const y = feetY.get() - f * FIGURE.hero * 0.48;
    return {
      opacity: 0.75 * (1 - 0.7 * settle),
      transform: [{ translateX: feetX.get() - HALO_W / 2 }, { translateY: y - HALO_H / 2 }, { scale: f }],
    };
  });
  const shadow = useAnimatedStyle(() => {
    const f = figure.get();
    const settle = Math.max(perch.get(), pick.get());
    const y = feetY.get() - 0.3 * UNIT * f;
    return {
      opacity: 1 - settle,
      transform: [{ translateX: feetX.get() - SHADOW_W / 2 }, { translateY: y - SHADOW_H / 2 }, { scale: f }],
    };
  });
  const core = useAnimatedStyle(() => {
    const f = figure.get();
    const settle = Math.max(perch.get(), pick.get());
    const y = feetY.get() - 0.3 * UNIT * f;
    return {
      opacity: 1 - settle,
      transform: [{ translateX: feetX.get() - CORE_W / 2 }, { translateY: y - CORE_H / 2 }, { scale: f }],
    };
  });
  const dockGlow = useAnimatedStyle(() => {
    const e = reduced ? 0 : energy.get();
    const y = height - bottom - composerHeight.get() / 2 + dockY.get() + 34;
    return {
      opacity: 0.22 + 0.3 * e,
      transform: [
        { translateX: width / 2 - glowW / 2 },
        { translateY: y - GLOW_RY * 2 },
        { scaleY: (GLOW_RY + 44 * e) / GLOW_RY },
      ],
    };
  });
  const runner = useAnimatedStyle(() => {
    const e = reduced ? 0 : energy.get();
    const x = width / 2 + Math.sin(spin.get() * 2.6) * (composerWidth.get() / 2) * 0.6;
    const y = height - bottom - composerHeight.get() / 2 + dockY.get();
    return {
      opacity: e * 0.95,
      transform: [
        { translateX: x - RUN_RX * 2 },
        { translateY: y - RUN_RY * 2 },
        { scaleX: (50 + 22 * e) / RUN_RX },
      ],
    };
  });
  // Each pass of the runner lifts a breath of light off the composer.
  const breath = useAnimatedStyle(() => {
    const e = reduced ? 0 : energy.get();
    const turn = spin.get() * 0.5;
    const phase = turn - Math.floor(turn);
    const crest = phase * 150;
    const y = height - bottom - composerHeight.get() / 2 + dockY.get() - crest;
    return {
      opacity: (1 - phase) * e * 0.3,
      transform: [
        { translateX: width / 2 - breathRX * 2 },
        { translateY: y - BREATH_RY * 2 },
        { scaleX: ((composerWidth.get() / 2) * 1.1) / breathRX },
        { scaleY: (BREATH_RY + crest * 0.3) / BREATH_RY },
      ],
    };
  });
  // Letting go: one pale wave carries up the page.
  const releaseWave = useAnimatedStyle(() => {
    const r = reduced ? 1 : release.get();
    if (r <= 0 || r >= 1) return { opacity: 0 };
    const dock = height - bottom - composerHeight.get() / 2 + dockY.get();
    const centre = dock - r * (dock + 60);
    return {
      opacity: (1 - r) * 0.5,
      transform: [{ translateY: centre - WAVE_H / 2 }, { scaleY: (64 + 70 * r) / 64 }],
    };
  });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
      {/* Paper, a little brighter toward the top, as if lit from above. */}
      <LinearGradient
        colors={[withAlpha("#FFFFFF", 0.3), withAlpha("#FFFFFF", 0)]}
        locations={[0, 0.8]}
        style={StyleSheet.absoluteFill}
      />
      {/* The studio light behind the companion. It is white, never coloured. */}
      <Animated.View style={[styles.layer, { width: HALO_W, height: HALO_H }, halo]}>
        <Bloom id="morsel-halo" color="#FFFFFF" width={HALO_W} height={HALO_H} />
      </Animated.View>
      <Animated.View style={[styles.layer, { width: glowW, height: GLOW_RY * 4 }, dockGlow]}>
        <Bloom id="morsel-dock" color={palette.glow} width={glowW} height={GLOW_RY * 4} />
      </Animated.View>
      <Animated.View style={[styles.layer, { width: RUN_RX * 4, height: RUN_RY * 4 }, runner]}>
        <Bloom id="morsel-runner" color={palette.glow} width={RUN_RX * 4} height={RUN_RY * 4} />
      </Animated.View>
      <Animated.View style={[styles.layer, { width: breathRX * 4, height: BREATH_RY * 4 }, breath]}>
        <Bloom id="morsel-breath" color={light} width={breathRX * 4} height={BREATH_RY * 4} />
      </Animated.View>
      <Animated.View style={[styles.layer, { width, height: WAVE_H }, releaseWave]}>
        <LinearGradient
          colors={[withAlpha(wave, 0), withAlpha(wave, 0.45), wave, withAlpha(wave, 0.45), withAlpha(wave, 0)]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Where the figure stands: a wide soft shadow and a closer, darker one. */}
      <Animated.View style={[styles.layer, { width: SHADOW_W, height: SHADOW_H }, shadow]}>
        <Bloom id="morsel-shadow" color={palette.ink} width={SHADOW_W} height={SHADOW_H} peak={0.1} />
      </Animated.View>
      <Animated.View style={[styles.layer, { width: CORE_W, height: CORE_H }, core]}>
        <Bloom id="morsel-shadow-core" color={palette.ink} width={CORE_W} height={CORE_H} peak={0.13} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", left: 0, top: 0 },
});
