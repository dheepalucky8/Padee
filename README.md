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

## Run the app

```bash
npm install
npx expo start -c
```

Scan the QR code with **Expo Go** (SDK 54).

## Install a faster Android APK (no Expo Go)

This builds an installable **APK in the cloud** (no Android Studio on your PC).

1. Create a free Expo account: https://expo.dev/signup  
2. On your computer, in the Padee folder:

```bash
git pull
npm install
npm install -g eas-cli
eas login
eas build:configure
npm run build:android:preview
```

3. When asked, create a new Expo project / generate credentials (choose defaults / yes).  
4. Wait for the build to finish on https://expo.dev (often 10–20 minutes the first time).  
5. Open the build page → **Download** the `.apk`.  
6. Copy the APK to your phone and open it to install.  
   - If Android blocks it: **Settings → Security → allow install from unknown apps** (Files/Chrome).  
7. Open **Padee** from your app drawer — it loads much faster than Expo Go.

Later updates: run `npm run build:android:preview` again, download the new APK, and install over the old one.

### Camera text reading

Photos are read with the OCR.space API (works in Expo Go).  
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
```
