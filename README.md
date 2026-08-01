# Padee (Mobile)

**Padee** is a mobile study app that turns textbook photos into printable practice worksheets and question papers.

Supports **CBSE**, **ICSE**, and **Matriculation** for **Grades 1–8**, with **Easy / Medium / Difficult** levels.

## Features

1. Choose board, grade, subject, difficulty, and worksheet vs question-paper format  
2. Capture textbook pages with the camera (or pick from gallery)  
3. On-device OCR reads the lesson text (iOS / Android development build)  
4. Generate framed questions and **share / print an A4 PDF**

A **Try demo lesson** path is included for quick testing without photos.

## Run the app

```bash
npm install
npx expo start
```

Then:

- press `a` for Android emulator / device  
- press `i` for iOS simulator (macOS)  
- scan the QR code with Expo Go (camera + gallery work; on-device OCR needs a [development build](https://docs.expo.dev/develop/development-builds/introduction/))  
- press `w` for web preview of the UI flow

### Native OCR note

In **Expo Go**, use **Try demo lesson** or paste textbook text (camera/gallery still work for attaching photos).

On-device OCR is optional for a custom/development build:

```bash
npx expo install expo-text-extractor
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

## Stack

- Expo (**SDK 54**, Expo Go compatible) + Expo Router  
- React Native  
- `expo-image-picker` for camera / gallery  
- Optional on-device OCR via `expo-text-extractor` in a development build  
- `expo-print` + `expo-sharing` for printable PDFs  

## Project layout

```
app/           Screens (home, create wizard)
lib/           Boards, OCR helpers, question generator, print HTML
constants/     Brand colors
assets/        Icons & splash
```
