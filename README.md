# Crumbwise

A one-screen food diary for iPhone and Android, built with Expo SDK 57 and Expo Router. Snap a meal, pick
breakfast, lunch, dinner or a snack, and get a little receipt with calories and macros. Ask "how much
protein today?" for a visual answer, and tap Crumbwise, the bun, to open a calendar made of meal stickers.

Runs in the Expo Go app (SDK 57) on iPhone and Android, and in the browser.

```bash
yarn install
yarn dev        # starts Expo with a tunnel; scan the QR code with Expo Go
```

## Make it yours

Everything brand-related lives in `constants/content.ts`: the app name, the user's name, colours, the
mascot's colours, daily goals, sample meals (name, calories, protein, carbs, fat, photo) and all copy.
Sample photos are in `assets/meals/`. Open the app with `?demo=1` to reset the diary to the sample one.

On iOS 26 and later the surfaces use native Liquid Glass; Android, the web and older iPhones get soft cream
cards instead (see the `*.ios.tsx` files in `components/ui/`).

The answers are worked out on the device from the diary. There is no server, account or analytics.

Based on Zest by Appllama (MIT). See [NOTICE.md](NOTICE.md).
