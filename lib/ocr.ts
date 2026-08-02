import { Platform } from "react-native";

export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

type TextExtractorModule = {
  isSupported?: boolean;
  extractTextFromImage: (uri: string) => Promise<string[]>;
};

function loadTextExtractor(): TextExtractorModule | null {
  try {
    // Optional native module — available in custom/dev builds, not Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-text-extractor") as TextExtractorModule;
  } catch {
    return null;
  }
}

/** True when we can attempt OCR (native module or JS Tesseract fallback). */
export function isOcrSupported(): boolean {
  return true;
}

async function imageUriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith("data:")) return uri;

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read image."));
      reader.readAsDataURL(blob);
    });
  }

  // Legacy FileSystem API — works in Expo Go (require avoids TS pulling package src)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FileSystem = require("expo-file-system/legacy") as {
    readAsStringAsync: (
      fileUri: string,
      options: { encoding: string },
    ) => Promise<string>;
    EncodingType: { Base64: string };
  };
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const lower = uri.toLowerCase();
  const mime = lower.endsWith(".png")
    ? "image/png"
    : lower.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

async function extractWithTesseract(uri: string): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const dataUrl = await imageUriToDataUrl(uri);
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    return cleanOcrText(text);
  } finally {
    await worker.terminate();
  }
}

async function extractWithNative(uri: string): Promise<string | null> {
  const mod = loadTextExtractor();
  if (!mod?.isSupported) return null;
  const lines = await mod.extractTextFromImage(uri);
  return cleanOcrText(lines.join("\n"));
}

/**
 * Read text from a textbook photo.
 * 1) Native OCR when available
 * 2) Tesseract.js fallback for Expo Go / web
 */
export async function extractTextFromImageUri(uri: string): Promise<string> {
  try {
    const native = await extractWithNative(uri);
    if (native) return native;
  } catch {
    // Fall through to Tesseract
  }

  const text = await extractWithTesseract(uri);
  if (!text) {
    throw new Error(
      "No readable text found. Try a clearer photo, or paste the lesson text below.",
    );
  }
  return text;
}

/** Sample textbook excerpt for demo without a camera. */
export const SAMPLE_TEXTBOOK_TEXT = `
Living Things and Non-Living Things

All things around us can be grouped into living things and non-living things.
Living things need air, water and food to stay alive. Plants and animals are
living things. Humans are also living things.

Living things grow. A seed grows into a plant. A baby grows into an adult.
Living things can move. Animals move from one place to another to find food
and shelter. Plants move their parts. For example, the sunflower turns towards
the sun.

Living things breathe. Animals take in oxygen and give out carbon dioxide.
Plants take in carbon dioxide and give out oxygen during the day. Living things
reproduce. Animals lay eggs or give birth to young ones. Plants produce seeds.

Non-living things do not need food, air or water. They do not grow, move on
their own, breathe or reproduce. A rock, a chair, a book and a pencil are
examples of non-living things. Water, air and soil are also non-living, but they
are very important for living things.

Habitat is the place where a living thing lives. A fish lives in water. A bird
lives in a nest on a tree. A camel lives in the desert. Different animals have
different habitats that suit their needs.

Photosynthesis is the process by which green plants make their own food using
sunlight, water and carbon dioxide. Chlorophyll in the leaves helps plants
capture sunlight. Oxygen is released during photosynthesis.
`.trim();
