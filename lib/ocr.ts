import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import type { RecognitionResult, TextBlock, TextLine } from "expo-mlkit-ocr";

const MAX_EDGE = 2400;
const MIN_EDGE = 1400;

export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/[|¦]/g, "I")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function sameRow(a: TextLine, b: TextLine): boolean {
  const ay = a.boundingBox.y + a.boundingBox.height / 2;
  const by = b.boundingBox.y + b.boundingBox.height / 2;
  const threshold =
    Math.max(a.boundingBox.height, b.boundingBox.height, 12) * 0.55;
  return Math.abs(ay - by) <= threshold;
}

/** Sort lines top→bottom, left→right so multi-column pages stay readable. */
function linesInReadingOrder(blocks: TextBlock[]): TextLine[] {
  const lines = blocks.flatMap((block) => block.lines || []);
  lines.sort((a, b) => {
    if (sameRow(a, b)) return a.boundingBox.x - b.boundingBox.x;
    return a.boundingBox.y - b.boundingBox.y;
  });
  return lines;
}

function textFromRecognition(result: RecognitionResult): string {
  if (result.blocks?.length) {
    const lines = linesInReadingOrder(result.blocks);
    if (lines.length) {
      const parts: string[] = [];
      let prev: TextLine | null = null;
      for (const line of lines) {
        const text = line.text.trim();
        if (!text) continue;
        if (prev) {
          const gap =
            line.boundingBox.y - (prev.boundingBox.y + prev.boundingBox.height);
          const breakGap = Math.max(prev.boundingBox.height, 16) * 1.15;
          if (gap > breakGap) parts.push("");
        }
        parts.push(text);
        prev = line;
      }
      return cleanOcrText(parts.join("\n"));
    }
  }
  return cleanOcrText(result.text || "");
}

/**
 * Normalize camera photos for OCR: keep detail, avoid huge uploads/decodes.
 */
async function prepareCameraPhoto(uri: string): Promise<string> {
  const probe = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const longest = Math.max(probe.width, probe.height);
  const actions: ImageManipulator.Action[] = [];

  if (longest > MAX_EDGE) {
    actions.push(
      probe.width >= probe.height
        ? { resize: { width: MAX_EDGE } }
        : { resize: { height: MAX_EDGE } },
    );
  } else if (longest < MIN_EDGE && longest > 0) {
    const scale = MIN_EDGE / longest;
    actions.push(
      probe.width >= probe.height
        ? { resize: { width: Math.round(probe.width * scale) } }
        : { resize: { height: Math.round(probe.height * scale) } },
    );
  }

  const prepared = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: Platform.OS === "web",
  });

  return prepared.uri;
}

async function extractWithMlKit(uri: string): Promise<string> {
  const { recognizeText, isSupported } = await import("expo-mlkit-ocr");

  if (!isSupported()) {
    throw new Error(
      "On-device text reading is not available on this device. Rebuild Padee on a supported phone OS.",
    );
  }

  const result = await recognizeText(uri);
  const text = textFromRecognition(result);

  if (!text || text.length < 20) {
    throw new Error(
      "Could not read enough text. Use brighter light, fill the frame with the page, hold steady, and try again.",
    );
  }

  return text;
}

/** OCR.space — web-only fallback (Expo Go / browser). */
const OCR_API_KEY =
  process.env.EXPO_PUBLIC_OCR_API_KEY?.trim() || "helloworld";

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: Array<{
    ParsedText?: string;
  }>;
};

async function extractWithOcrSpace(uri: string): Promise<string> {
  const prepared = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1800 } }],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!prepared.base64) {
    throw new Error("Could not prepare this photo for text reading.");
  }

  const form = new FormData();
  form.append("base64Image", `data:image/jpeg;base64,${prepared.base64}`);
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("OCREngine", "2");
  form.append("scale", "true");
  form.append("detectOrientation", "true");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: OCR_API_KEY },
    body: form,
  });

  if (!response.ok) {
    throw new Error(
      `Could not reach the text reader (${response.status}). Check internet and try again.`,
    );
  }

  const data = (await response.json()) as OcrSpaceResponse;
  if (data.IsErroredOnProcessing) {
    const msg = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join(" ")
      : data.ErrorMessage || "Could not read text from this photo.";
    throw new Error(String(msg));
  }

  const text = cleanOcrText(
    (data.ParsedResults || []).map((r) => r.ParsedText || "").join("\n"),
  );

  if (!text || text.length < 20) {
    throw new Error(
      "Could not read enough text. Use brighter light, fill the frame with the page, and try again.",
    );
  }

  return text;
}

/**
 * Read textbook text from a camera photo.
 * Native builds use on-device Google ML Kit (accurate, offline).
 * Web falls back to OCR.space.
 */
export async function extractTextFromImageUri(uri: string): Promise<string> {
  const preparedUri = await prepareCameraPhoto(uri);

  if (Platform.OS === "web") {
    return extractWithOcrSpace(preparedUri);
  }

  try {
    return await extractWithMlKit(preparedUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/native module|ExpoMlkitOcr|not supported on web/i.test(message)) {
      throw new Error(
        "On-device text reading needs a rebuilt Padee APK. Run npm run build:android:local, then try the camera again.",
      );
    }
    throw err instanceof Error ? err : new Error(message);
  }
}
