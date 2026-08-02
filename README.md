# Padee (Mobile)

**Padee** is a mobile study app that turns textbook photos into printable practice worksheets and question papers.

Supports **CBSE**, **ICSE**, and **Matriculation** for **Grades 1–8**, with **Easy / Medium / Difficult** levels.

## Features

1. Welcome screen with Padee’s schoolyard study artwork  
2. Create a student **profile** (name, board, grade)  
3. Native **dashboard** — quick worksheet / paper, difficulty, and out-of marks  
4. Capture textbook pages with the camera (or pick from gallery)  
5. Generate Easy / Medium / Difficult papers with **all formats** (fill-ups, choose, match, one-word, 2-mark, give-reason)  
6. Choose total marks: **10 / 15 / 25 / 35 / 50 / 75 / 100**  
7. **Share / print an A4 PDF**

A **Try demo lesson** path is included for quick testing without photos.

## Run the app

```bash
npm install
npx expo start
```

Then:

- press `a` for Android emulator / device  
- press `i` for iOS simulator (macOS)  
- scan the QR code with Expo Go  
- press `w` for web preview of the UI flow

### Text recognition (OCR)

Padee tries to read textbook photos with **Tesseract.js** (may take a few seconds).  
If reading fails, paste the lesson text or use **Try demo lesson** — the app will not block you.

## Stack

- Expo (**SDK 54**, Expo Go compatible) + Expo Router  
- React Native  
- `expo-image-picker` for camera / gallery  
- `tesseract.js` for reading textbook photos  
- `expo-print` + `expo-sharing` for printable PDFs  

## Project layout

```
app/           Screens (home, create wizard)
lib/           Boards, OCR helpers, question generator, print HTML
constants/     Brand colors
assets/        Icons & splash
```
