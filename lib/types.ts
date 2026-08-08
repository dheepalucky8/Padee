export type Board = "CBSE" | "ICSE" | "Matriculation";

export type Difficulty = "easy" | "medium" | "hard";

export type DocumentType = "worksheet" | "question-paper";

export type QuestionType =
  | "fill-blank"
  | "true-false"
  | "mcq"
  | "one-word"
  | "match"
  | "two-mark"
  | "give-reason"
  | "long-answer";

export type MarksTotal = 10 | 15 | 25 | 35 | 50 | 75 | 100;

export interface WorksheetConfig {
  board: Board;
  grade: number;
  subject: string;
  difficulty: Difficulty;
  documentType: DocumentType;
  title?: string;
  /** Target total marks for the paper / worksheet */
  targetMarks: MarksTotal;
}

export interface CapturedPage {
  id: string;
  uri: string;
  extractedText: string;
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
