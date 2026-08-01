export type Board = "CBSE" | "ICSE" | "Matriculation";

export type Difficulty = "easy" | "medium" | "hard";

export type DocumentType = "worksheet" | "question-paper";

export type QuestionType =
  | "fill-blank"
  | "true-false"
  | "mcq"
  | "short-answer"
  | "long-answer"
  | "match"
  | "one-word";

export interface WorksheetConfig {
  board: Board;
  grade: number;
  subject: string;
  difficulty: Difficulty;
  documentType: DocumentType;
  title?: string;
  questionCount: number;
}

export interface CapturedPage {
  id: string;
  file: File;
  previewUrl: string;
  extractedText: string;
  ocrProgress: number;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string;
  marks: number;
  section?: string;
}

export interface GeneratedPaper {
  config: WorksheetConfig;
  sourceSummary: string;
  questions: Question[];
  totalMarks: number;
  createdAt: string;
  instructions: string[];
}
