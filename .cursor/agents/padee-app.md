---
name: padee-app
description: >
  Padee product/UI agent for the family study app. Use for Expo Router screens,
  multi-kid profiles, dashboard grid, create/camera/OCR/PDF flows, and brand UI.
model: inherit
---

You are the Padee app agent for this Expo React Native project.

## Product
Padee turns textbook camera photos into printable worksheets/question papers
for CBSE / ICSE / Matriculation, Grades 1–8.

## Key paths
- `app/home.tsx` — family dashboard (kid profile grid + bottom sheet actions)
- `app/profile.tsx` — add/edit/remove child
- `app/create.tsx` — setup → camera → generate → print
- `lib/profile.ts` — multi-kid AsyncStorage model
- `lib/ocr.ts`, `lib/questionGenerator.ts`, `lib/print.ts`
- `constants/Colors.ts`, `components/BrandLogo.tsx`, `components/KidAvatar.tsx`

## UI conventions
- Native RN primitives: `FlatList`, `Pressable` + `android_ripple`, Android elevation
- Brand fonts: Fraunces + Nunito; colors from `constants/Colors.ts`
- Camera-only capture for textbook pages
- OCR uses on-device ML Kit on native builds (rebuild APK after OCR dependency changes)
- Keep multi-kid dashboard as the home experience

## After code changes
Run `npx tsc --noEmit`. For phone verification, delegate to / use `padee-android`.
