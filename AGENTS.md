# Padee — use a **local** Cursor Agent

This repo should be driven from **Cursor Desktop → Local Agent**, not Cloud Agent.
Phone USB, `adb`, and `npm run build:android:local` only work on your laptop.

## Start the local agent (on your PC)

1. Open **Cursor Desktop**
2. **File → Open Folder** → `C:\Users\Admin\Padee` (or your clone path)
3. Pull latest:
   ```powershell
   git checkout cursor/padee-worksheet-app-bcef
   git pull
   npm install
   ```
4. Open Agent with **Ctrl+I**
5. Set the environment to **Local / This Computer** (not Cloud)
6. Ask for what you need, for example:
   - `Build and install Padee on my phone`
   - `Add another child profile to the dashboard`
   - `/padee-android fix unauthorized adb`

Project agents live in `.cursor/agents/`:
- `padee-android` — APK build / USB install
- `padee-app` — screens, profiles, OCR, PDF UI

## Stack

- Expo SDK 54 + Expo Router + React Native
- Multi-kid profiles in AsyncStorage (`lib/profile.ts`)
- Camera OCR via OCR.space (`lib/ocr.ts`)
- PDF via `expo-print` / `expo-sharing`

## Local APK (no Expo Go / no Android Studio UI)

```powershell
npm install
npm run android:devices
npm run build:android:local
```

Builds a **release** APK with the JS bundle embedded, installs it, and launches Padee.

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
