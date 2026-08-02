import type { Board, Difficulty, DocumentType, MarksTotal } from "./types";

export const BOARDS: { id: Board; label: string; blurb: string }[] = [
  {
    id: "CBSE",
    label: "CBSE",
    blurb: "Central Board — NCERT-aligned practice",
  },
  {
    id: "ICSE",
    label: "ICSE",
    blurb: "CISCE board — concept-focused worksheets",
  },
  {
    id: "Matriculation",
    label: "Matriculation",
    blurb: "State Matriculation syllabus support",
  },
];

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const SUBJECTS = [
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Tamil",
  "Hindi",
  "Environmental Studies",
  "General Knowledge",
] as const;

export const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  description: string;
}[] = [
  {
    id: "easy",
    label: "Easy",
    description:
      "Fill-ups, choose, match, one-word, 2-mark & give-reason — gentler wording",
  },
  {
    id: "medium",
    label: "Medium",
    description:
      "All formats with clearer application and short explanations",
  },
  {
    id: "hard",
    label: "Difficult",
    description:
      "All formats with tougher prompts and deeper give-reason / long answers",
  },
];

export const DOCUMENT_TYPES: {
  id: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    id: "worksheet",
    label: "Worksheet",
    description: "Practice sheet with writing space",
  },
  {
    id: "question-paper",
    label: "Question Paper",
    description: "Exam-style paper with marks & sections",
  },
];

/** Out-of marks options for papers and worksheets */
export const MARKS_TOTALS: MarksTotal[] = [10, 15, 25, 35, 50, 75, 100];

export const QUESTION_FORMATS = [
  { id: "fill-blank", label: "Fill-ups", marks: 1 },
  { id: "mcq", label: "Choose", marks: 1 },
  { id: "match", label: "Match", marks: 2 },
  { id: "one-word", label: "One word", marks: 1 },
  { id: "two-mark", label: "2-mark", marks: 2 },
  { id: "give-reason", label: "Give reason", marks: 2 },
] as const;
