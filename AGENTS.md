# Padee — local agent notes

Prefer running Agent **locally in Cursor Desktop** (not Cloud) for this repo.
Phone USB install, `adb`, and the local APK script only work on the user’s laptop.

## Stack

- Expo SDK 54 + Expo Router + React Native
- Multi-kid profiles in AsyncStorage (`lib/profile.ts`)
- Camera OCR via OCR.space (`lib/ocr.ts`)
- PDF via `expo-print` / `expo-sharing`

## Local APK (no Expo Go / no Android Studio UI)

Needs Node.js + USB phone with debugging authorized:

```powershell
npm install
npm run android:devices
npm run build:android:local
```

`build:android:local` downloads portable JDK + Android SDK cmdline tools into `.jdk/` and `.android-sdk/`, builds a **release** APK (JS embedded), installs it, and launches Padee.

## App screens

- `app/index.tsx` — welcome
- `app/home.tsx` — family dashboard (kid profile grid)
- `app/profile.tsx` — add/edit child
- `app/create.tsx` — capture → generate → print

## Conventions

- Keep branding (Fraunces + Nunito, teal/coral in `constants/Colors.ts`)
- Do not reintroduce Expo Go as the primary run path
- Do not require an Expo account for local builds
- Camera-only capture for textbook pages (no demo/paste as primary path)
