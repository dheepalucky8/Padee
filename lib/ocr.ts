import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

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

/** OCR.space free/test key — set EXPO_PUBLIC_OCR_API_KEY for higher limits. */
const OCR_API_KEY =
  process.env.EXPO_PUBLIC_OCR_API_KEY?.trim() || "helloworld";

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: Array<{
    ParsedText?: string;
  }>;
};

async function prepareCameraPhoto(uri: string): Promise<{
  uri: string;
  base64?: string | null;
}> {
  return ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    {
      compress: 0.75,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: Platform.OS === "web",
    },
  );
}

async function extractWithOcrSpace(prepared: {
  uri: string;
  base64?: string | null;
}): Promise<string> {
  const form = new FormData();

  if (Platform.OS === "web" && prepared.base64) {
    form.append("base64Image", `data:image/jpeg;base64,${prepared.base64}`);
  } else {
    // React Native camera file upload
    form.append("file", {
      uri: prepared.uri,
      type: "image/jpeg",
      name: "textbook.jpg",
    } as unknown as Blob);
  }

  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("OCREngine", "2");
  form.append("scale", "true");
  form.append("detectOrientation", "true");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: OCR_API_KEY,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(
      `Could not reach the text reader (${response.status}). Check internet and try the camera again.`,
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
      "Could not read enough text. Use brighter light, fill the frame with the page, and take the photo again.",
    );
  }

  return text;
}

/**
 * Read textbook text from a camera photo.
 * Cloud OCR works in Expo Go — camera only, no paste/demo required.
 */
export async function extractTextFromImageUri(uri: string): Promise<string> {
  const prepared = await prepareCameraPhoto(uri);
  return extractWithOcrSpace(prepared);
}
