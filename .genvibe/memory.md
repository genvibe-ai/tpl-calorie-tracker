# Morsel: calorie-tracker template

## What it is
A one-screen food diary for Expo SDK 57 + Expo Router that runs in Expo Go on iPhone and Android (and on the web).
Log a meal photo (camera, library or "Try a sample meal"), pick the meal type, get a receipt with calories and
macros; ask "how much protein today?" and get a visual answer; tap Morsel (the bun) for the sticker calendar.
Answers are local (lib/diary.ts answerAbout): no server, AI service, account or analytics. The diary is saved
on the device; chats reset on relaunch. `?demo=1` resets the diary to the sample one.

## Files
- constants/content.ts: THE source of brand name, user name, palette, mascot colours, goals, sample meals
  (name, kcal, protein/carbs/fat, photo, meal type, receipt line), everyday meals and all copy.
- app/_layout.tsx (providers), app/index.tsx (renders DiaryScreen), app/+not-found.tsx (redirects home).
- components/DiaryScreen.tsx: the screen; chat flow, photo menu, overlays, Android back button.
- components/: Composer, ChatTurn, MealReply (choices + receipt), VisualAnswer, Calendar (sticker diary),
  MealEditor, SampleCamera, Mascot (the bun, SVG shapes), Backdrop (light and glow), Stickers, Thinking.
- components/ui/: GlassSurface, GlassButton, ProgressiveBlur, Frost, Icon, Touch, Bloom, PlainSurface, RoundButton.
- lib/: diary.ts (types, dates, totals, answers, sample diary), diaryStore.ts (zustand + persist),
  storage.ts / storage.web.ts, photos.tsx, haptics.ts, motion.ts, color.ts, chat.ts.
- hooks/: useScene (shared UI-thread motion), useTilt(.web), useKeyboardPosition.
- assets/meals/*.jpg (sample photos, real JPEG), assets/stickers/*.svg (drawn stickers), assets/images (icons).

## Design tokens
Cream paper #F6F0E6, ink #2C2620, paprika accent #D0643A, warm glow #F4CFA4, sage/caramel guide bars.
System font; big tabular numbers; stickers tilted a few degrees; surfaces radius 22–36. Light mode only.

## Expo Go rules
- Only modules bundled in Expo Go SDK 57: expo-*, @expo/ui, @expo/vector-icons, reanimated 4.5.1,
  worklets 0.10.1, gesture-handler, keyboard-controller, react-native-svg, flash-list 2, zustand.
- Never add modules that need a development build (MMKV, Nitro, track-player, zeego, expo-dev-client,
  custom native code) or native versions other than SDK 57's. Use `npx expo install`; run with `yarn dev`.
- Do not set ios.bundleIdentifier or android.package in app.json (GenVibe sets them at build time).

## Platform fallbacks (keep them)
- *.ios.tsx files hold iOS-only code: GlassSurface (Liquid Glass, expo-glass-effect), GlassButton
  (SwiftUI via @expo/ui), ProgressiveBlur (masked blur). The plain .tsx files are the Android/web versions.
- Frost.android.tsx: translucent veil instead of live blur. ChatScroll.web, storage.web, useTilt.web.
- Icon.tsx: SF Symbols on iOS, Material Symbols on Android/web; add icons with both names.
- Overlays (camera, editor) render inside the screen, not in Modal, so keyboard tracking works on Android.
- haptics.ts never throws and is skipped on the web.

## How to rebrand
1. Edit constants/content.ts: brand, user, palette, mascotColors, goals, sampleMeals, everydayMeals, copy.
2. Replace photos in assets/meals/ (real JPEGs, light backgrounds) and update the `require` paths.
3. app.json: name, slug, scheme; regenerate assets/images/* icons if the mascot changes.
The sample diary refreshes itself when sample meals change; meals people logged are kept.
