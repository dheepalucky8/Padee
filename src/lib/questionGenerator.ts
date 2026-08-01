import type {
  Difficulty,
  DocumentType,
  GeneratedPaper,
  Question,
  QuestionType,
  WorksheetConfig,
} from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "they",
  "them",
  "their",
  "we",
  "our",
  "you",
  "your",
  "he",
  "she",
  "his",
  "her",
  "from",
  "with",
  "by",
  "as",
  "into",
  "about",
  "also",
  "not",
  "no",
  "yes",
  "very",
  "so",
  "than",
  "then",
  "when",
  "where",
  "which",
  "who",
  "what",
  "how",
  "all",
  "each",
  "every",
  "some",
  "any",
  "such",
  "only",
  "own",
  "same",
  "other",
  "another",
  "more",
  "most",
  "many",
  "much",
  "few",
  "during",
  "example",
  "examples",
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.split(/\s+/).length >= 5)
    .slice(0, 40);
}

function extractKeyTerms(text: string): string[] {
  const words = text
    .replace(/[^A-Za-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const freq = new Map<string, number>();
  for (const word of words) {
    const lower = word.toLowerCase();
    if (STOP_WORDS.has(lower) || lower.length < 4) continue;
    if (/^\d+$/.test(lower)) continue;
    freq.set(lower, (freq.get(lower) || 0) + 1);
  }

  // Prefer words that appear more than once, then longer words
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word)
    .slice(0, 24);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function findWordInSentence(sentence: string, term: string): string | null {
  const match = sentence.match(new RegExp(`\\b${term}\\b`, "i"));
  return match ? match[0] : null;
}

function pickDistractors(term: string, pool: string[], count = 3): string[] {
  const distractors = pool
    .filter((t) => t.toLowerCase() !== term.toLowerCase())
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(capitalize);
  while (distractors.length < count) {
    distractors.push(`Option ${String.fromCharCode(65 + distractors.length)}`);
  }
  return distractors;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function marksFor(type: QuestionType, difficulty: Difficulty, documentType: DocumentType): number {
  if (documentType === "worksheet") return 1;
  const base: Record<QuestionType, number> = {
    "fill-blank": 1,
    "true-false": 1,
    mcq: 1,
    "one-word": 1,
    match: 2,
    "short-answer": 2,
    "long-answer": 4,
  };
  const bump = difficulty === "hard" ? 1 : 0;
  return base[type] + (type === "long-answer" || type === "short-answer" ? bump : 0);
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function typesForDifficulty(difficulty: Difficulty): QuestionType[] {
  switch (difficulty) {
    case "easy":
      return ["fill-blank", "true-false", "one-word", "mcq", "match"];
    case "medium":
      return ["mcq", "fill-blank", "short-answer", "one-word", "true-false"];
    case "hard":
      return ["short-answer", "long-answer", "mcq", "fill-blank", "one-word"];
  }
}

function buildFillBlank(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question | null {
  const term =
    terms.find((t) => findWordInSentence(sentence, t)) ||
    sentence
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z-]/g, ""))
      .find((w) => w.length > 4 && !STOP_WORDS.has(w.toLowerCase()));

  if (!term) return null;
  const actual = findWordInSentence(sentence, term) || term;
  const prompt = sentence.replace(new RegExp(`\\b${actual}\\b`), "________");
  return {
    id,
    type: "fill-blank",
    prompt: `Fill in the blank:\n${prompt}`,
    answer: actual,
    marks: marksFor("fill-blank", difficulty, documentType),
    section: "A",
  };
}

function buildTrueFalse(
  sentence: string,
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
  makeFalse: boolean,
  terms: string[],
): Question {
  let prompt = sentence;
  let answer = "True";

  if (makeFalse && terms.length >= 2) {
    const present = terms.find((t) => findWordInSentence(sentence, t));
    const replacement = terms.find(
      (t) => t.toLowerCase() !== present?.toLowerCase(),
    );
    if (present && replacement) {
      const actual = findWordInSentence(sentence, present)!;
      prompt = sentence.replace(
        new RegExp(`\\b${actual}\\b`),
        capitalize(replacement),
      );
      answer = "False";
    }
  }

  return {
    id,
    type: "true-false",
    prompt: `State whether True or False:\n${prompt}`,
    answer,
    marks: marksFor("true-false", difficulty, documentType),
    section: "A",
  };
}

function buildMcq(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question | null {
  const term = terms.find((t) => findWordInSentence(sentence, t));
  if (!term) return null;
  const actual = findWordInSentence(sentence, term)!;
  const blanked = sentence.replace(new RegExp(`\\b${actual}\\b`), "________");
  const options = shuffle([
    capitalize(actual),
    ...pickDistractors(actual, terms, 3),
  ]);

  return {
    id,
    type: "mcq",
    prompt:
      difficulty === "hard"
        ? `Choose the most suitable word to complete the idea:\n${blanked}`
        : `Choose the correct answer:\n${blanked}`,
    options,
    answer: capitalize(actual),
    marks: marksFor("mcq", difficulty, documentType),
    section: "B",
  };
}

function buildOneWord(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question | null {
  const term = terms.find((t) => findWordInSentence(sentence, t));
  if (!term) return null;
  const actual = findWordInSentence(sentence, term)!;
  return {
    id,
    type: "one-word",
    prompt: `Answer in one word:\nWhich word from the lesson completes this idea — "${sentence.replace(new RegExp(`\\b${actual}\\b`), "________")}"?`,
    answer: actual,
    marks: marksFor("one-word", difficulty, documentType),
    section: "B",
  };
}

function buildShortAnswer(
  sentence: string,
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question {
  const cleaned = sentence.replace(/[.!?]+$/, "");
  return {
    id,
    type: "short-answer",
    prompt:
      difficulty === "hard"
        ? `In 2–3 sentences, explain why this is important:\n"${cleaned}."`
        : `Answer briefly:\n${cleaned}? Write your answer in 1–2 sentences.`,
    answer: sentence,
    marks: marksFor("short-answer", difficulty, documentType),
    section: "C",
  };
}

function buildLongAnswer(
  sentences: string[],
  terms: string[],
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question {
  const topic = terms[0] ? capitalize(terms[0]) : "the topic";
  const support = sentences.slice(0, 2).join(" ");
  return {
    id,
    type: "long-answer",
    prompt: `Write a detailed answer (5–8 lines):\nDescribe ${topic} based on your textbook lesson. Include key points and examples.`,
    answer: support || `Key points about ${topic} from the lesson.`,
    marks: marksFor("long-answer", difficulty, documentType),
    section: "D",
  };
}

function buildMatch(
  terms: string[],
  sentences: string[],
  id: string,
  difficulty: Difficulty,
  documentType: DocumentType,
): Question | null {
  const pairs: { left: string; right: string }[] = [];
  for (const term of terms) {
    const sentence = sentences.find((s) => findWordInSentence(s, term));
    if (!sentence) continue;
    const snippet = sentence
      .replace(new RegExp(`\\b${findWordInSentence(sentence, term)}\\b`, "i"), "…")
      .slice(0, 90);
    pairs.push({ left: capitalize(term), right: snippet });
    if (pairs.length >= 4) break;
  }
  if (pairs.length < 3) return null;

  const left = pairs.map((p, i) => `${i + 1}. ${p.left}`).join("\n");
  const rightShuffled = shuffle(pairs.map((p) => p.right));
  const right = rightShuffled
    .map((r, i) => `${String.fromCharCode(97 + i)}. ${r}`)
    .join("\n");
  const answer = pairs
    .map((p) => {
      const letter = String.fromCharCode(97 + rightShuffled.indexOf(p.right));
      return `${p.left} → ${letter}`;
    })
    .join("; ");

  return {
    id,
    type: "match",
    prompt: `Match the following:\n\nColumn A\n${left}\n\nColumn B\n${right}`,
    answer,
    marks: marksFor("match", difficulty, documentType),
    section: "A",
  };
}

function instructionsFor(
  config: WorksheetConfig,
): string[] {
  const common = [
    "Read the questions carefully before answering.",
    "Write neatly in the spaces provided.",
  ];

  if (config.documentType === "question-paper") {
    return [
      ...common,
      "All questions are compulsory unless stated otherwise.",
      "Marks for each question are indicated against it.",
      config.difficulty === "hard"
        ? "Support your answers with examples from the lesson."
        : "Keep answers clear and to the point.",
    ];
  }

  return [
    ...common,
    "This worksheet is for practice — take your time.",
    config.difficulty === "easy"
      ? "Use the textbook page if you need a hint."
      : "Try answering without looking at the book first.",
  ];
}

export function generatePaper(
  sourceText: string,
  config: WorksheetConfig,
): GeneratedPaper {
  const sentences = splitSentences(sourceText);
  const terms = extractKeyTerms(sourceText);

  if (sentences.length === 0) {
    throw new Error(
      "Could not find enough readable text in the textbook images. Try clearer photos or use the demo text.",
    );
  }

  const desiredTypes = typesForDifficulty(config.difficulty);
  const questions: Question[] = [];
  let sentenceIndex = 0;
  let trueFalseToggle = false;

  const nextSentence = () => {
    const s = sentences[sentenceIndex % sentences.length];
    sentenceIndex += 1;
    return s;
  };

  // Always try one match set for easy/medium worksheets
  if (config.difficulty !== "hard" && questions.length < config.questionCount) {
    const matchQ = buildMatch(
      terms,
      sentences,
      makeId("q", questions.length),
      config.difficulty,
      config.documentType,
    );
    if (matchQ) questions.push(matchQ);
  }

  let guard = 0;
  let typeCursor = questions.length;
  while (questions.length < config.questionCount && guard < config.questionCount * 8) {
    guard += 1;
    const type = desiredTypes[typeCursor % desiredTypes.length];
    typeCursor += 1;
    const sentence = nextSentence();
    const id = makeId("q", questions.length);
    let question: Question | null = null;

    switch (type) {
      case "fill-blank":
        question = buildFillBlank(
          sentence,
          terms,
          id,
          config.difficulty,
          config.documentType,
        );
        break;
      case "true-false":
        question = buildTrueFalse(
          sentence,
          id,
          config.difficulty,
          config.documentType,
          trueFalseToggle,
          terms,
        );
        trueFalseToggle = !trueFalseToggle;
        break;
      case "mcq":
        question = buildMcq(
          sentence,
          terms,
          id,
          config.difficulty,
          config.documentType,
        );
        break;
      case "one-word":
        question = buildOneWord(
          sentence,
          terms,
          id,
          config.difficulty,
          config.documentType,
        );
        break;
      case "short-answer":
        question = buildShortAnswer(
          sentence,
          id,
          config.difficulty,
          config.documentType,
        );
        break;
      case "long-answer":
        question = buildLongAnswer(
          sentences,
          terms,
          id,
          config.difficulty,
          config.documentType,
        );
        break;
      case "match":
        // Only one match block per paper
        if (!questions.some((q) => q.type === "match")) {
          question = buildMatch(
            terms,
            sentences,
            id,
            config.difficulty,
            config.documentType,
          );
        }
        break;
    }

    if (question) {
      const duplicate = questions.some(
        (q) =>
          q.type === question!.type &&
          q.answer.toLowerCase() === question!.answer.toLowerCase() &&
          q.prompt.slice(0, 40) === question!.prompt.slice(0, 40),
      );
      if (!duplicate) questions.push(question);
    }
  }

  // Fallback with rotating simpler types if still short
  const fallbackTypes: QuestionType[] =
    config.difficulty === "hard"
      ? ["short-answer", "mcq", "fill-blank", "one-word"]
      : ["true-false", "mcq", "fill-blank", "one-word", "short-answer"];
  let fallbackCursor = 0;
  while (questions.length < config.questionCount && fallbackCursor < sentences.length * 3) {
    const sentence = nextSentence();
    const id = makeId("q", questions.length);
    const type = fallbackTypes[fallbackCursor % fallbackTypes.length];
    fallbackCursor += 1;
    let fallback: Question | null = null;
    if (type === "true-false") {
      fallback = buildTrueFalse(
        sentence,
        id,
        config.difficulty,
        config.documentType,
        fallbackCursor % 2 === 0,
        terms,
      );
    } else if (type === "mcq") {
      fallback = buildMcq(
        sentence,
        terms,
        id,
        config.difficulty,
        config.documentType,
      );
    } else if (type === "one-word") {
      fallback = buildOneWord(
        sentence,
        terms,
        id,
        config.difficulty,
        config.documentType,
      );
    } else if (type === "short-answer") {
      fallback = buildShortAnswer(
        sentence,
        id,
        config.difficulty,
        config.documentType,
      );
    } else {
      fallback = buildFillBlank(
        sentence,
        terms,
        id,
        config.difficulty,
        config.documentType,
      );
    }
    if (!fallback) continue;
    const duplicate = questions.some(
      (q) => q.prompt.slice(0, 50) === fallback!.prompt.slice(0, 50),
    );
    if (!duplicate) questions.push(fallback);
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const topicHint = terms.slice(0, 4).map(capitalize).join(", ");

  return {
    config,
    sourceSummary:
      topicHint.length > 0
        ? `Based on textbook content about: ${topicHint}`
        : "Based on the uploaded textbook pages",
    questions: questions.slice(0, config.questionCount),
    totalMarks,
    createdAt: new Date().toISOString(),
    instructions: instructionsFor(config),
  };
}
