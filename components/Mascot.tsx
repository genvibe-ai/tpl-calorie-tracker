/**
 * Crumbwise, the companion: a little bun with a bite taken out, drawn from plain
 * shapes (react-native-svg) on a 140-unit grid. Its parts are layered views,
 * so the gaze, head turn, blink, lean and hop run on the UI thread on iOS,
 * Android and the web alike. Colours come from mascotColors in content.ts.
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { brand, mascotColors as c } from "@/constants/content";
import { FIGURE, feetIn, type Scene } from "@/hooks/useScene";

const SIZE = FIGURE.hero;
/** Points per unit of the 140-unit drawing grid. */
const U = SIZE / 140;
const [footX, footY] = feetIn(SIZE);
/** Pivots, as offsets from the centre of the square (where transforms apply). */
const FEET = footY - SIZE / 2;
const NECK = (76 - 70) * U;
const EYES = (75 - 70) * U;

const BODY =
  "M36 118C24 117 18 106 19 94C20 66 40 41 68 38C79 37 89 38.5 97.5 42A5.6 5.6 0 0 0 101.3 50.8A5.6 5.6 0 0 0 108.3 57.4A5.6 5.6 0 0 0 116.8 60.6C119.5 70 121 80 121 92C121 106 114 117 104 118Q70 120.5 36 118Z";
const BITE = "M97.5 42A5.6 5.6 0 0 0 101.3 50.8A5.6 5.6 0 0 0 108.3 57.4A5.6 5.6 0 0 0 116.8 60.6";

function Layer({ children }: { children: React.ReactNode }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 140 140" style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
}

export function Mascot({
  scene,
  onPress,
  calendarOpen,
}: {
  scene: Scene;
  onPress: () => void;
  calendarOpen: boolean;
}) {
  const { gazeX, gazeY, headX, headY, bodyX, figure, feetX, feetY, reduced, hop, expression } = scene;
  const lid = useSharedValue(1);
  const pressure = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(
      () => lid.set(withSequence(withTiming(0.07, { duration: 95 }), withTiming(1, { duration: 135 }))),
      3870,
    );
    return () => {
      clearInterval(id);
      cancelAnimation(lid);
    };
  }, [lid, reduced]);

  // Stands on its feet: scale, lean and squash pivot around them.
  const place = useAnimatedStyle(() => ({
    transform: [
      { translateX: feetX.get() - footX },
      { translateY: feetY.get() - footY - hop.get() * 12 },
      { translateY: FEET },
      { scale: figure.get() },
      { rotate: `${bodyX.get() * 1.8}deg` },
      { scaleX: 1 + pressure.get() * 0.035 },
      { scaleY: 1 - pressure.get() * 0.05 },
      { translateY: -FEET },
    ],
  }));
  const head = useAnimatedStyle(() => ({
    transform: [
      { translateY: NECK },
      { translateX: headX.get() * 3.6 * U },
      { translateY: headY.get() * 2 * U },
      { rotate: `${headX.get() * 0.035}rad` },
      { translateY: -NECK },
    ],
  }));
  const blink = useAnimatedStyle(() => ({
    transform: [{ translateY: EYES }, { scaleY: lid.get() }, { translateY: -EYES }],
  }));
  const pupils = useAnimatedStyle(() => ({
    transform: [{ translateX: gazeX.get() * 3 * U }, { translateY: gazeY.get() * 2.3 * U }],
  }));
  const smile = useAnimatedStyle(() => ({ opacity: 1 - Math.max(0, expression.get()) }));
  const curious = useAnimatedStyle(() => ({ opacity: Math.max(0, -expression.get()) }));
  const wry = useAnimatedStyle(() => ({ opacity: Math.max(0, expression.get()) }));

  const tap = Gesture.Tap()
    .maxDuration(650)
    .onBegin(() => pressure.set(withTiming(1, { duration: 100 })))
    .onFinalize((_event, success) => {
      pressure.set(withTiming(0, { duration: 170 }));
      if (success) scheduleOnRN(onPress);
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${brand.companion}, ${calendarOpen ? "close" : "open"} food diary`}
        accessibilityHint="Opens your food diary."
        onAccessibilityTap={onPress}
        style={[{ position: "absolute", left: 0, top: 0, width: SIZE, height: SIZE, zIndex: 45 }, place]}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Layer>
            <Ellipse cx={70} cy={132} rx={30} ry={2.4} fill="#2C2620" opacity={0.07} />
            {/* Little shoes keep their footing while the bun looks around. */}
            <Path d="M47 112Q45 121 42 124Q38 132.5 55 131.5Q63 131 62.5 124L62 113Z" fill={c.shoe} />
            <Path d="M78 113L77.5 124Q77 131 85 131.5Q102 132.5 98 124Q95 121 93 112Z" fill={c.shoe} />
            <Path
              d="M43 129Q50 130.8 60 129M80 129Q90 130.8 97 128.5"
              fill="none"
              stroke={c.sole}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Layer>
          <Animated.View style={[StyleSheet.absoluteFill, head]}>
            <Layer>
              <Defs>
                <ClipPath id="crumbwise-body">
                  <Path d={BODY} />
                </ClipPath>
                <RadialGradient id="crumbwise-fill" cx="0.36" cy="0.3" r="0.78">
                  <Stop offset="0" stopColor={c.bodyLight} />
                  <Stop offset="0.62" stopColor={c.body} />
                  <Stop offset="1" stopColor={c.bodyDark} />
                </RadialGradient>
                <LinearGradient id="crumbwise-belly" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={c.belly} stopOpacity={0} />
                  <Stop offset="1" stopColor={c.belly} stopOpacity={0.55} />
                </LinearGradient>
              </Defs>
              <G clipPath="url(#crumbwise-body)">
                <Rect x={0} y={0} width={140} height={140} fill="url(#crumbwise-fill)" />
                <Rect x={0} y={94} width={140} height={26} fill="url(#crumbwise-belly)" />
                {/* The bite shows the soft crumb inside. */}
                <Path d={BITE} fill="none" stroke={c.crumb} strokeWidth={7.5} strokeLinejoin="round" />
                <Ellipse cx={44} cy={60} rx={14} ry={6.5} transform="rotate(-48 44 60)" fill={c.sheen} opacity={0.85} />
                <G fill={c.seed}>
                  <Ellipse cx={59} cy={47} rx={2.6} ry={1.3} transform="rotate(-14 59 47)" />
                  <Ellipse cx={72} cy={44.5} rx={2.6} ry={1.3} transform="rotate(10 72 44.5)" />
                  <Ellipse cx={85} cy={47.5} rx={2.6} ry={1.3} transform="rotate(28 85 47.5)" />
                  <Ellipse cx={66} cy={51.5} rx={2.4} ry={1.2} transform="rotate(-4 66 51.5)" />
                </G>
              </G>
              <Ellipse cx={40} cy={91} rx={6} ry={3.2} fill={c.cheek} opacity={0.55} />
              <Ellipse cx={94} cy={91} rx={6} ry={3.2} fill={c.cheek} opacity={0.55} />
            </Layer>
            <Animated.View style={[StyleSheet.absoluteFill, blink]}>
              <Layer>
                <Rect x={44} y={63} width={18} height={24} rx={9} fill={c.eye} />
                <Rect x={72} y={63} width={18} height={24} rx={9} fill={c.eye} />
              </Layer>
              <Animated.View style={[StyleSheet.absoluteFill, pupils]}>
                <Layer>
                  <Rect x={49} y={68.5} width={9} height={15} rx={4.5} fill={c.pupil} />
                  <Rect x={77} y={68.5} width={9} height={15} rx={4.5} fill={c.pupil} />
                  <Circle cx={51.8} cy={71.8} r={2} fill="#FFFFFF" />
                  <Circle cx={79.8} cy={71.8} r={2} fill="#FFFFFF" />
                </Layer>
              </Animated.View>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, smile]}>
              <Layer>
                <Path d="M60 92Q67 99 74 92" fill="none" stroke={c.mouth} strokeWidth={2.6} strokeLinecap="round" />
              </Layer>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, curious]}>
              <Layer>
                <Path
                  d="M45 58Q53 52.5 61 55.5M73 55.5Q81 52.5 89 58"
                  fill="none"
                  stroke={c.mouth}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              </Layer>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, wry]}>
              <Layer>
                <Path
                  d="M45 57Q53 56.5 61 59.5M73 55Q82 49 90 54"
                  fill="none"
                  stroke={c.mouth}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
                <Path d="M59 94Q68 98.5 77 90" fill="none" stroke={c.mouth} strokeWidth={2.6} strokeLinecap="round" />
              </Layer>
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
