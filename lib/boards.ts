import type { Board, Difficulty, DocumentType } from "./types";

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
    description: "Fill-ups, true/false, and simple recall",
  },
  {
    id: "medium",
    label: "Medium",
    description: "MCQs, short answers, and one-word questions",
  },
  {
    id: "hard",
    label: "Difficult",
    description: "Explain, apply, and higher-order thinking",
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

export const QUESTION_COUNTS = [8, 10, 12, 15, 20] as const;
