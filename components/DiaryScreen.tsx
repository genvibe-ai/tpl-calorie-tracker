/**
 * The whole app on one screen: the welcome with the companion, the chat where
 * meals are logged and questions answered, the composer, the sticker diary and
 * the overlays (photo menu, sample camera, meal editor). Answers are local
 * (lib/diary.ts answerAbout); there is no server or AI service.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Keyboard, Linking, Platform, Pressable, Text, View } from "react-native";
import { KeyboardController, KeyboardEvents } from "react-native-keyboard-controller";
import { scheduleOnRN } from "react-native-worklets";
import * as ImagePicker from "expo-image-picker";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import Animated, { useAnimatedStyle, withSequence, withSpring, withTiming } from "react-native-reanimated";
import {
  brand,
  copy,
  palette,
  sampleCameraOrder,
  sampleMeals,
  user,
  type SampleMealId,
} from "@/constants/content";
import type { Turn } from "@/lib/chat";
import {
  answerAbout,
  clockTime,
  dayKey,
  intakeMood,
  isSampleMeal,
  sampleMeal,
  totalOn,
  type Meal,
  type MealPhoto,
  type MealType,
} from "@/lib/diary";
import { useDiary } from "@/lib/diaryStore";
import { haptics } from "@/lib/haptics";
import { MealPhotosProvider } from "@/lib/photos";
import { keepPhoto } from "@/lib/storage";
import { useScene } from "@/hooks/useScene";
import { Backdrop } from "./Backdrop";
import { CalorieCalendar } from "./Calendar";
import { ChatScroll } from "./ChatScroll";
import { ChatTurn } from "./ChatTurn";
import { Composer } from "./Composer";
import { Mascot } from "./Mascot";
import { MealEditor, type EditRequest } from "./MealEditor";
import { CHOICE_RETIRE_MS } from "./MealReply";
import { SampleCamera } from "./SampleCamera";
import { GlassButton } from "./ui/GlassButton";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./ui/Icon";
import { ProgressiveBlur } from "./ui/ProgressiveBlur";
import { Touch } from "./ui/Touch";

let eventSequence = 0;
/** Called by event handlers; the sequence also distinguishes rapid attachments. */
function eventId(prefix: string) {
  return `${prefix}-${Date.now()}-${++eventSequence}`;
}
/** "Try a sample meal" offers the next sample each time. */
let sampleTurn = 0;

export function DiaryScreen({ demo = false, displayName = user.name }: { demo?: boolean; displayName?: string }) {
  const scene = useScene();
  const meals = useDiary((s) => s.meals);
  const guide = useDiary((s) => s.guide);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [calendar, setCalendar] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [sampleCamera, setSampleCamera] = useState<SampleMealId | null>(null);
  const [editor, setEditor] = useState<EditRequest | null>(null);
  const [focused, setFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(108);
  const [conversation, setConversation] = useState(0);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout>[]>([]);
  const list = useRef<FlashListRef<Turn>>(null);
  const touching = useRef(false);
  const touches = useRef(0);
  const hasTurns = turns.length > 0;
  const { pick, perch, dockY, composerHeight, energy, mood, release, expression } = scene;
  const clearTimers = useCallback(() => {
    pending.current.forEach(clearTimeout);
    pending.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (demo) useDiary.getState().seedDemo();
  }, [demo]);
  useEffect(() => {
    if (!calendar) expression.set(withTiming(intakeMood(totalOn(meals, dayKey()), guide), { duration: 220 }));
  }, [calendar, meals, guide, expression]);
  const later = (fn: () => void, ms: number) => {
    pending.current.push(setTimeout(fn, ms));
  };
  // A single scroll follows measured content changes. No delayed scrollToEnd
  // calls compete with keyboard-controlled content insets.
  const followContent = () => {
    if (!touching.current && !KeyboardController.isVisible())
      list.current?.getNativeScrollRef()?.scrollToEnd({ animated: !scene.reduced });
  };
  useEffect(() => {
    const show = KeyboardEvents.addListener("keyboardDidShow", () => setFocused(true));
    const hide = KeyboardEvents.addListener("keyboardDidHide", () => setFocused(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const activity = (value: boolean) => {
    active.current = value;
    setBusy(value);
  };
  useEffect(() => {
    perch.set(withSpring(hasTurns ? 1 : 0, { damping: 25, stiffness: 170, mass: 0.95 }));
  }, [hasTurns, perch]);
  useEffect(() => {
    mood.set(busy ? 2 : focused ? 1 : 0);
    energy.set(withTiming(busy ? 0.65 : 0, { duration: busy ? 850 : 220 }));
    if (!busy) release.set(withTiming(1, { duration: 650 }));
    else release.set(0);
  }, [busy, focused, energy, mood, release]);
  const openCalendar = () => {
    Keyboard.dismiss();
    setPhotoMenu(false);
    setCalendar(true);
    pick.set(withSpring(1, { damping: 26, stiffness: 180, mass: 0.9 }));
    haptics.light();
  };
  const closeCalendar = () => {
    // Keep the sheet mounted until it has left the screen.
    pick.set(
      withSpring(0, { damping: 27, stiffness: 230, mass: 0.85 }, (finished) => {
        if (finished) scheduleOnRN(setCalendar, false);
      }),
    );
  };
  // Android's back button closes whatever is on top.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editor) setEditor(null);
      else if (sampleCamera) setSampleCamera(null);
      else if (photoMenu) setPhotoMenu(false);
      else if (calendar) closeCalendar();
      else return false;
      return true;
    });
    return () => subscription.remove();
    // closeCalendar only touches stable shared values and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, sampleCamera, photoMenu, calendar]);
  const dock = useAnimatedStyle(() => ({
    transform: [{ translateY: dockY.get() + pick.get() * (composerHeight.get() + scene.bottom + 45) }],
  }));
  const transcript = useAnimatedStyle(() => ({ flex: 1, opacity: 1 - pick.get() * 0.82 }));
  const greeting = useAnimatedStyle(() => ({
    opacity: hasTurns || focused ? 0 : 1 - Math.min(1, pick.get() * 2 + scene.keyboardProgress.get() * 2),
    transform: [{ translateY: -scene.keyboardProgress.get() * 90 }],
  }));
  const showPhotoMenu = () => {
    Keyboard.dismiss();
    setPhotoMenu((old) => !old);
  };
  const openSampleCamera = () => {
    setPhotoMenu(false);
    setSampleCamera(sampleCameraOrder[sampleTurn++ % sampleCameraOrder.length] ?? null);
  };
  const attach = (photo: MealPhoto) => {
    if (active.current) return;
    Keyboard.dismiss();
    setPhotoMenu(false);
    activity(true);
    const id = eventId("photo");
    const suggested = isSampleMeal(photo.sample) ? sampleMeals[photo.sample].mealType : undefined;
    setTurns((old) => [
      ...old,
      { id, role: "user", kind: "photo", photo },
      { id: `${id}-question`, role: "assistant", kind: "question", photo, suggested, state: "thinking" },
    ]);
    later(() => {
      list.current?.prepareForLayoutAnimationRender();
      setTurns((old) =>
        old.map((turn) =>
          turn.id === `${id}-question`
            ? { ...turn, state: "choosing", text: copy.askMealType[suggested ?? "unknown"] }
            : turn,
        ),
      );
      activity(false);
    }, 900);
  };
  const choosePhoto = async (camera: boolean) => {
    setPhotoMenu(false);
    Keyboard.dismiss();
    try {
      if (camera && Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(copy.alerts.cameraTitle, copy.alerts.cameraBody, [
            { text: copy.alerts.notNow, style: "cancel" },
            { text: copy.alerts.openSettings, onPress: () => void Linking.openSettings() },
          ]);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], allowsEditing: false, quality: 0.85 };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      attach({ uri: await keepPhoto(result.assets[0].uri, eventId("meal")) });
    } catch {
      Alert.alert(
        camera ? copy.alerts.cameraUnavailable : copy.alerts.photoUnavailable,
        camera ? copy.alerts.cameraUnavailableBody : copy.alerts.photoUnavailableBody,
        [
          { text: copy.alerts.cancel, style: "cancel" },
          { text: copy.alerts.library, onPress: () => void choosePhoto(false) },
        ],
      );
    }
  };
  const editMeal = (meal: Meal) =>
    setEditor({
      name: meal.name,
      meal,
      kcal: meal.kcal,
      onSave: (name, kcal) => useDiary.getState().edit(meal.id, { name, kcal }),
      onDelete: () => useDiary.getState().remove(meal.id),
    });
  const chooseType = (turn: Turn, type: MealType) => {
    if (active.current || turn.state !== "choosing") return;
    const complete = (meal: Meal) => {
      activity(true);
      // Retire the choices before introducing the receipt. Its photo then stays
      // mounted while the estimate arrives in short visual chunks.
      const replyId = turn.id;
      setTurns((old) =>
        old.map((item) =>
          item.id === replyId ? { ...item, mealId: meal.id, pendingMeal: meal, state: "confirming" } : item,
        ),
      );
      later(() => {
        setTurns((old) => old.map((item) => (item.id === replyId ? { ...item, kind: "meal", state: "thinking" } : item)));
      }, CHOICE_RETIRE_MS);
      later(() => {
        useDiary.getState().add(meal);
        setTurns((old) => old.map((item) => (item.id === replyId ? { ...item, state: "complete" } : item)));
        activity(false);
        scene.hop.set(withSequence(withTiming(0.3, { duration: 130 }), withTiming(0, { duration: 210 })));
        haptics.success();
      }, CHOICE_RETIRE_MS + 500);
    };
    const fields = { id: `meal-${turn.id}`, date: dayKey(), type, time: clockTime() };
    const sample = turn.photo?.sample;
    if (isSampleMeal(sample)) complete(sampleMeal(sample, fields));
    // A photo of your own needs a name and calories: there's no food recognition.
    else setEditor({ name: "", onSave: (name, kcal) => complete({ ...fields, name, kcal, photo: turn.photo }) });
  };
  const send = async (question: string) => {
    if (active.current || !question.trim()) return false;
    active.current = true;
    const current = generation.current;
    // Let the keyboard finish leaving before inserting messages or clearing the
    // field, so these layout changes don't interrupt its travel.
    await KeyboardController.dismiss();
    if (current !== generation.current) return false;
    setPhotoMenu(false);
    activity(true);
    const id = eventId("answer");
    const diary = useDiary.getState();
    const answer = answerAbout(question, diary.meals, diary.guide);
    setTurns((old) => [
      ...old,
      { id: `${id}-prompt`, role: "user", kind: "text", text: question },
      { id, role: "assistant", kind: "text", state: "thinking", text: "" },
    ]);
    later(() => {
      setTurns((old) =>
        old.map((item) =>
          item.id === id
            ? {
                ...item,
                state: "complete",
                answer,
                text: [answer.value && `${answer.value} ${answer.unit}`, answer.caption, answer.detail]
                  .filter(Boolean)
                  .join(". "),
              }
            : item,
        ),
      );
      activity(false);
    }, 620);
    return true;
  };
  const stop = () => {
    clearTimers();
    activity(false);
    setTurns((old) =>
      old.map((turn) =>
        turn.state === "thinking" || turn.state === "confirming"
          ? {
              ...turn,
              kind: turn.photo ? "question" : turn.kind,
              state: turn.photo ? "choosing" : "stopped",
              text: turn.photo ? copy.afterStop : turn.text,
            }
          : turn,
      ),
    );
  };
  const fresh = () => {
    generation.current += 1;
    setConversation((old) => old + 1);
    clearTimers();
    activity(false);
    Keyboard.dismiss();
    setTurns([]);
    setPhotoMenu(false);
    setSampleCamera(null);
    closeCalendar();
  };
  const look = (x: number, y: number) => {
    scene.touchX.set(x);
    scene.touchY.set(y);
    scene.touched.set(++touches.current);
  };
  return (
    <MealPhotosProvider>
      <View
        style={{ flex: 1, backgroundColor: palette.paper }}
        onTouchStart={(e) => look(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onTouchMove={(e) => look(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        // On the web the companion also follows the mouse.
        onPointerMove={Platform.OS === "web" ? (e) => look(e.nativeEvent.pageX, e.nativeEvent.pageY) : undefined}
      >
        <Backdrop scene={scene} />
        <Animated.View
          style={transcript}
          accessibilityElementsHidden={calendar}
          importantForAccessibility={calendar ? "no-hide-descendants" : "auto"}
        >
          <FlashList
            ref={list}
            renderScrollComponent={ChatScroll}
            data={turns}
            extraData={meals}
            keyExtractor={(turn) => turn.id}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ disabled: true }}
            onContentSizeChange={followContent}
            onScrollBeginDrag={() => {
              touching.current = true;
            }}
            onScrollEndDrag={() => {
              touching.current = false;
            }}
            onMomentumScrollEnd={() => {
              touching.current = false;
            }}
            contentContainerStyle={{
              paddingTop: scene.top + 78,
              paddingHorizontal: 24,
              paddingBottom: Math.max(scene.bottom + 178, inputHeight + 112),
            }}
            renderItem={({ item: turn }) => (
              <ChatTurn
                turn={turn}
                meals={meals}
                guide={guide}
                reduced={scene.reduced}
                onChoose={chooseType}
                onEdit={editMeal}
                onCalendar={openCalendar}
              />
            )}
          />
        </Animated.View>
        <ProgressiveBlur edge="top" height={scene.top + 66} color={palette.paper} />
        <View
          accessibilityElementsHidden={calendar}
          style={{
            position: "absolute",
            top: scene.top,
            left: 18,
            right: 18,
            height: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: 44 }} pointerEvents="none" />
          <Text style={{ fontSize: 18, fontWeight: "600", letterSpacing: -0.35, color: palette.ink }}>
            {brand.name}
          </Text>
          <GlassButton name="compose" label={`New ${brand.name} conversation`} onPress={fresh} />
        </View>
        <Animated.View
          pointerEvents={!hasTurns && !focused && !calendar ? "box-none" : "none"}
          accessibilityElementsHidden={hasTurns || focused || calendar}
          style={[
            { position: "absolute", top: scene.height * 0.495, left: 24, right: 24, alignItems: "center" },
            greeting,
          ]}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 32,
              lineHeight: 37,
              fontWeight: "500",
              letterSpacing: -1.15,
              textAlign: "center",
              color: palette.ink,
            }}
          >
            {copy.greeting(new Date().getHours())},{"\n"}
            {displayName}.
          </Text>
          <Touch label={copy.logMeal} onPress={showPhotoMenu} expand style={{ marginTop: 28 }}>
            <GlassSurface
              interactive
              style={{
                height: 48,
                borderRadius: 24,
                flexDirection: "row",
                gap: 9,
                paddingHorizontal: 21,
                alignItems: "center",
              }}
            >
              <Icon name="camera" size={17} color={palette.ink} />
              <Text style={{ fontSize: 15, fontWeight: "500", color: palette.ink }}>{copy.logMeal}</Text>
            </GlassSurface>
          </Touch>
        </Animated.View>
        <Animated.View
          pointerEvents={calendar ? "none" : "box-none"}
          accessibilityElementsHidden={calendar}
          style={[{ position: "absolute", left: 0, right: 0, bottom: scene.bottom, alignItems: "center" }, dock]}
        >
          <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: -scene.bottom }}>
            <ProgressiveBlur edge="bottom" height={148 + scene.bottom} color={palette.paper} />
          </View>
          <Composer
            key={conversation}
            scene={scene}
            busy={busy}
            onSend={send}
            onStop={stop}
            onPhoto={showPhotoMenu}
            onCalendar={openCalendar}
            onHeight={setInputHeight}
            onFocusChange={setFocused}
          />
        </Animated.View>
        <CalorieCalendar
          scene={scene}
          open={calendar}
          meals={meals}
          guide={guide}
          onClose={closeCalendar}
          onAdd={() => {
            closeCalendar();
            setPhotoMenu(true);
          }}
          onEdit={editMeal}
          onGuide={() =>
            setEditor({
              name: copy.editor.guideTitle,
              kcal: guide,
              guide: true,
              onSave: (_name, kcal) => useDiary.getState().setGuide(kcal),
            })
          }
        />
        <Mascot scene={scene} calendarOpen={calendar} onPress={calendar ? closeCalendar : openCalendar} />
        {photoMenu && (
          <View style={{ position: "absolute", inset: 0, zIndex: 50 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss photo menu"
              onPress={() => setPhotoMenu(false)}
              style={{ position: "absolute", inset: 0 }}
            />
            <GlassSurface
              interactive
              style={{
                position: "absolute",
                left: 24,
                bottom: scene.bottom + 72,
                width: 232,
                borderRadius: 28,
                paddingVertical: 8,
              }}
            >
              {(
                [
                  { label: copy.photoMenu.camera, icon: "camera", mode: "camera" },
                  { label: copy.photoMenu.library, icon: "photo", mode: "library" },
                  { label: copy.photoMenu.sample, icon: "sample", mode: "sample" },
                ] as const
              ).map((item) => (
                <Touch
                  key={item.mode}
                  label={item.label}
                  onPress={() => {
                    if (item.mode === "sample" || (demo && item.mode === "camera")) openSampleCamera();
                    else void choosePhoto(item.mode === "camera");
                  }}
                  style={{ height: 52, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", gap: 13 }}
                >
                  <Icon name={item.icon} size={18} color={palette.ink} />
                  <Text style={{ fontSize: 16, color: palette.ink }}>{item.label}</Text>
                </Touch>
              ))}
            </GlassSurface>
          </View>
        )}
        {sampleCamera && (
          <SampleCamera
            meal={sampleCamera}
            libraryPreview={sampleCameraOrder[sampleTurn % sampleCameraOrder.length] ?? sampleCamera}
            onClose={() => setSampleCamera(null)}
            onUse={(photo) => {
              setSampleCamera(null);
              attach(photo);
            }}
            onLibrary={() => {
              setSampleCamera(null);
              later(() => void choosePhoto(false), 400);
            }}
          />
        )}
        {editor && <MealEditor request={editor} onClose={() => setEditor(null)} />}
      </View>
    </MealPhotosProvider>
  );
}
