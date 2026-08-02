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
