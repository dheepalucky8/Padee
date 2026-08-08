# Padee (Mobile)

**Padee** is a mobile study app that turns textbook **camera photos** into printable practice worksheets and question papers.

Supports **CBSE**, **ICSE**, and **Matriculation** for **Grades 1–8**, with **Easy / Medium / Difficult** levels.

## Features

1. Welcome screen with Padee logo + schoolyard artwork  
2. Create a student **profile** (name, board, grade)  
3. Native **dashboard** — worksheet / paper, difficulty, and out-of marks  
4. **Camera capture** of textbook pages (text is read from the photo)  
5. Generate Easy / Medium / Difficult papers with **all formats** (fill-ups, choose, match, one-word, 2-mark, give-reason)  
6. Choose total marks: **10 / 15 / 25 / 35 / 50 / 75 / 100**  
7. **Share / print an A4 PDF**

## Install on your phone (no Expo Go, no Expo account)

Build a normal Android APK on your computer with **Android Studio**. You do **not** need an Expo account.

### 1. One-time setup on your PC

1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → **More Actions → SDK Manager** and install:
   - Android SDK Platform **35**
   - Android SDK Build-Tools **35**
   - Android SDK Platform-Tools
3. Install [Node.js LTS](https://nodejs.org/)

### 2. Build the APK

In the Padee project folder:

```bash
git checkout cursor/padee-worksheet-app-bcef
git pull
npm install
npm run build:android:local
```

When it finishes, the APK is here:

`android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Install on your phone

1. Copy `app-debug.apk` to your phone (USB, Drive, WhatsApp, etc.)
2. Open the file and install it  
   - If Android blocks it: **Settings → Security → allow install from unknown apps**
3. Open **Padee** from your app drawer — Expo Go is not used

### Optional: phone plugged into PC via USB

```bash
npm install
npx expo prebuild --platform android
npm run android
```

This installs and launches Padee directly on the connected phone/emulator.

## Optional: Expo Go (quick try only)

Needs the Expo Go app on your phone:

```bash
npm install
npx expo start -c
```

Scan the QR code with **Expo Go** (SDK 54). This is slower than the APK above.

## Optional: cloud APK via Expo (needs Expo signup)

If you prefer not to install Android Studio, Expo’s cloud builder can make the APK — that path **does** require a free Expo account:

```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:android:preview
```

Then download the `.apk` from https://expo.dev and install it on your phone.

### Camera text reading

Photos are read with the OCR.space API.  
Optional: set your own free key for higher limits:

```bash
# .env
EXPO_PUBLIC_OCR_API_KEY=your_free_key_from_ocr.space
```

Tips for best results: bright light, page filling the frame, steady shot.

## Stack

- Expo (**SDK 54**) + Expo Router  
- `expo-image-picker` — camera  
- OCR.space — read text from photos  
- `expo-print` + `expo-sharing` — printable PDFs  

## Project layout

```
app/           Screens (welcome, profile, dashboard, create)
lib/           Boards, OCR, question generator, print HTML
constants/     Brand colors
assets/        Logo, icons & splash
android/       Generated locally by prebuild (not committed)
```
