import type {
  Difficulty,
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

/** Every paper includes all of these formats when the marks total allows. */
const ALL_FORMATS: QuestionType[] = [
  "fill-blank",
  "mcq",
  "match",
  "one-word",
  "two-mark",
  "give-reason",
  "true-false",
  "long-answer",
];

const TYPE_MARKS: Record<QuestionType, number> = {
  "fill-blank": 1,
  "true-false": 1,
  mcq: 1,
  "one-word": 1,
  match: 2,
  "two-mark": 2,
  "give-reason": 2,
  "long-answer": 5,
};

const SECTION_FOR: Record<QuestionType, string> = {
  "fill-blank": "A",
  "true-false": "A",
  mcq: "B",
  "one-word": "B",
  match: "A",
  "two-mark": "C",
  "give-reason": "C",
  "long-answer": "D",
};

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.split(/\s+/).length >= 5)
    .slice(0, 48);
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

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word)
    .slice(0, 28);
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

function marksFor(type: QuestionType, difficulty: Difficulty): number {
  const base = TYPE_MARKS[type];
  if (type === "long-answer" && difficulty === "hard") return base + 1;
  if (type === "give-reason" && difficulty === "hard") return base + 1;
  return base;
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function buildFillBlank(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
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
    marks: marksFor("fill-blank", difficulty),
    section: SECTION_FOR["fill-blank"],
  };
}

function buildTrueFalse(
  sentence: string,
  id: string,
  difficulty: Difficulty,
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
    marks: marksFor("true-false", difficulty),
    section: SECTION_FOR["true-false"],
  };
}

function buildMcq(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
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
        ? `Choose the most suitable answer:\n${blanked}`
        : `Choose the correct answer:\n${blanked}`,
    options,
    answer: capitalize(actual),
    marks: marksFor("mcq", difficulty),
    section: SECTION_FOR.mcq,
  };
}

function buildOneWord(
  sentence: string,
  terms: string[],
  id: string,
  difficulty: Difficulty,
): Question | null {
  const term = terms.find((t) => findWordInSentence(sentence, t));
  if (!term) return null;
  const actual = findWordInSentence(sentence, term)!;
  return {
    id,
    type: "one-word",
    prompt: `Answer in one word:\n${sentence.replace(new RegExp(`\\b${actual}\\b`), "________")}`,
    answer: actual,
    marks: marksFor("one-word", difficulty),
    section: SECTION_FOR["one-word"],
  };
}

function buildTwoMark(
  sentence: string,
  id: string,
  difficulty: Difficulty,
): Question {
  const cleaned = sentence.replace(/[.!?]+$/, "");
  return {
    id,
    type: "two-mark",
    prompt:
      difficulty === "easy"
        ? `Answer in about 2–3 lines (2 marks):\nWhat do you understand from this — "${cleaned}."?`
        : `Answer briefly (2 marks):\n${cleaned}?`,
    answer: sentence,
    marks: marksFor("two-mark", difficulty),
    section: SECTION_FOR["two-mark"],
  };
}

function buildGiveReason(
  sentence: string,
  id: string,
  difficulty: Difficulty,
): Question {
  const cleaned = sentence.replace(/[.!?]+$/, "");
  return {
    id,
    type: "give-reason",
    prompt:
      difficulty === "hard"
        ? `Give reason (with an example):\nWhy is this true — "${cleaned}."?`
        : `Give reason:\nWhy — "${cleaned}."?`,
    answer: sentence,
    marks: marksFor("give-reason", difficulty),
    section: SECTION_FOR["give-reason"],
  };
}

function buildLongAnswer(
  sentences: string[],
  terms: string[],
  id: string,
  difficulty: Difficulty,
): Question {
  const topic = terms[0] ? capitalize(terms[0]) : "the topic";
  const support = sentences.slice(0, 2).join(" ");
  return {
    id,
    type: "long-answer",
    prompt:
      difficulty === "easy"
        ? `Write 4–5 lines about ${topic} from your lesson.`
        : `Write a detailed answer:\nDescribe ${topic} with key points and examples from the textbook.`,
    answer: support || `Key points about ${topic} from the lesson.`,
    marks: marksFor("long-answer", difficulty),
    section: SECTION_FOR["long-answer"],
  };
}

function buildMatch(
  terms: string[],
  sentences: string[],
  id: string,
  difficulty: Difficulty,
): Question | null {
  const pairs: { left: string; right: string }[] = [];
  for (const term of terms) {
    const sentence = sentences.find((s) => findWordInSentence(s, term));
    if (!sentence) continue;
    const actual = findWordInSentence(sentence, term)!;
    const snippet = sentence
      .replace(new RegExp(`\\b${actual}\\b`, "i"), "…")
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
    marks: marksFor("match", difficulty),
    section: SECTION_FOR.match,
  };
}

function buildQuestion(
  type: QuestionType,
  ctx: {
    sentence: string;
    sentences: string[];
    terms: string[];
    id: string;
    difficulty: Difficulty;
    trueFalseToggle: boolean;
  },
): Question | null {
  switch (type) {
    case "fill-blank":
      return buildFillBlank(ctx.sentence, ctx.terms, ctx.id, ctx.difficulty);
    case "true-false":
      return buildTrueFalse(
        ctx.sentence,
        ctx.id,
        ctx.difficulty,
        ctx.trueFalseToggle,
        ctx.terms,
      );
    case "mcq":
      return buildMcq(ctx.sentence, ctx.terms, ctx.id, ctx.difficulty);
    case "one-word":
      return buildOneWord(ctx.sentence, ctx.terms, ctx.id, ctx.difficulty);
    case "two-mark":
      return buildTwoMark(ctx.sentence, ctx.id, ctx.difficulty);
    case "give-reason":
      return buildGiveReason(ctx.sentence, ctx.id, ctx.difficulty);
    case "long-answer":
      return buildLongAnswer(
        ctx.sentences,
        ctx.terms,
        ctx.id,
        ctx.difficulty,
      );
    case "match":
      return buildMatch(ctx.terms, ctx.sentences, ctx.id, ctx.difficulty);
  }
}

function instructionsFor(config: WorksheetConfig): string[] {
  return [
    "Read the questions carefully before answering.",
    "Write neatly in the spaces provided.",
    `This paper is for a total of ${config.targetMarks} marks.`,
    "Marks for each question are shown in brackets.",
    "Formats include fill-ups, choose, match, one-word, 2-mark, and give-reason questions.",
    config.difficulty === "easy"
      ? "Take your time — use the textbook if you need a hint."
      : "Try answering without looking at the book first.",
  ];
}

function currentMarks(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.marks, 0);
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

  const target = config.targetMarks;
  const questions: Question[] = [];
  let sentenceIndex = 0;
  let trueFalseToggle = false;

  const nextSentence = () => {
    const s = sentences[sentenceIndex % sentences.length];
    sentenceIndex += 1;
    return s;
  };

  const tryAdd = (type: QuestionType): boolean => {
    const marks = marksFor(type, config.difficulty);
    if (currentMarks(questions) + marks > target) return false;
    if (type === "match" && questions.some((q) => q.type === "match")) {
      return false;
    }
    // Cap long answers so small papers stay balanced
    if (
      type === "long-answer" &&
      (target < 25 ||
        questions.filter((q) => q.type === "long-answer").length >=
          (target >= 75 ? 2 : 1))
    ) {
      return false;
    }

    const id = makeId("q", questions.length);
    const question = buildQuestion(type, {
      sentence: nextSentence(),
      sentences,
      terms,
      id,
      difficulty: config.difficulty,
      trueFalseToggle,
    });
    if (type === "true-false") trueFalseToggle = !trueFalseToggle;
    if (!question) return false;

    const duplicate = questions.some(
      (q) =>
        q.type === question.type &&
        q.prompt.slice(0, 48) === question.prompt.slice(0, 48),
    );
    if (duplicate) return false;

    questions.push(question);
    return true;
  };

  // First pass: ensure core school formats appear when marks allow
  const coreFirst: QuestionType[] = [
    "fill-blank",
    "mcq",
    "match",
    "one-word",
    "two-mark",
    "give-reason",
  ];
  for (const type of coreFirst) {
    tryAdd(type);
  }

  // Fill remaining marks by rotating all formats
  let guard = 0;
  let typeCursor = 0;
  while (currentMarks(questions) < target && guard < target * 8) {
    guard += 1;
    const remaining = target - currentMarks(questions);
    const candidates = ALL_FORMATS.filter(
      (t) => marksFor(t, config.difficulty) <= remaining,
    );
    if (candidates.length === 0) break;

    const type = candidates[typeCursor % candidates.length];
    typeCursor += 1;
    const added = tryAdd(type);
    if (!added) {
      // try a 1-mark filler if stuck
      if (remaining >= 1) {
        tryAdd("fill-blank") || tryAdd("mcq") || tryAdd("one-word");
      }
    }
  }

  // Last resort: pad with 1-mark fill-ups / MCQs
  guard = 0;
  while (currentMarks(questions) < target && guard < 40) {
    guard += 1;
    const remaining = target - currentMarks(questions);
    if (remaining <= 0) break;
    const ok =
      (remaining >= 1 && tryAdd("fill-blank")) ||
      (remaining >= 1 && tryAdd("mcq")) ||
      (remaining >= 1 && tryAdd("one-word")) ||
      (remaining >= 2 && tryAdd("two-mark"));
    if (!ok) break;
  }

  if (questions.length === 0) {
    throw new Error("Could not frame questions from this lesson text.");
  }

  const totalMarks = currentMarks(questions);
  const topicHint = terms.slice(0, 4).map(capitalize).join(", ");

  return {
    config,
    sourceSummary:
      topicHint.length > 0
        ? `Based on textbook content about: ${topicHint}`
        : "Based on the uploaded textbook pages",
    questions,
    totalMarks,
    createdAt: new Date().toISOString(),
    instructions: instructionsFor(config),
  };
}
