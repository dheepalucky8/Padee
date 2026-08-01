import type { createWorker } from "tesseract.js";

type Worker = Awaited<ReturnType<typeof createWorker>>;

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return createWorker("eng", 1, {
        logger: () => undefined,
      });
    })();
  }
  return workerPromise;
}

export async function extractTextFromImage(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const worker = await getWorker();

  if (onProgress) {
    // Tesseract v5+ progress via recognize options is limited; simulate stages
    onProgress(0.15);
  }

  const {
    data: { text },
  } = await worker.recognize(file, undefined, {
    text: true,
  });

  onProgress?.(1);
  return cleanOcrText(text);
}

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

export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return;
  const worker = await workerPromise;
  await worker.terminate();
  workerPromise = null;
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
