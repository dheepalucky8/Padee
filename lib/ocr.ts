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

export function isOcrSupported(): boolean {
  if (Platform.OS === "web") return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-text-extractor") as {
      isSupported?: boolean;
    };
    return Boolean(mod.isSupported);
  } catch {
    return false;
  }
}

/**
 * On-device OCR via Apple Vision / Google ML Kit.
 * Requires a development build or device runtime that includes expo-text-extractor.
 * Not available on web / Expo Go for all setups — callers should fall back to demo text.
 */
export async function extractTextFromImageUri(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error(
      "On-device OCR works on iOS/Android builds. Use the demo lesson on web, or type/paste the textbook text.",
    );
  }

  const { extractTextFromImage, isSupported } = await import(
    "expo-text-extractor"
  );

  if (!isSupported) {
    throw new Error(
      "Text recognition is not available on this device. Try the demo lesson or paste the text manually.",
    );
  }

  const lines = await extractTextFromImage(uri);
  const text = cleanOcrText(lines.join("\n"));
  if (!text) {
    throw new Error(
      "No readable text found. Try a clearer photo of the textbook page.",
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
