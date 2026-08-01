"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  FileText,
  LoaderCircle,
  Printer,
  Sparkles,
  Trash2,
  Upload,
  BookOpenText,
} from "lucide-react";
import {
  BOARDS,
  DIFFICULTIES,
  DOCUMENT_TYPES,
  GRADES,
  QUESTION_COUNTS,
  SUBJECTS,
} from "@/lib/boards";
import { extractTextFromImage, SAMPLE_TEXTBOOK_TEXT } from "@/lib/ocr";
import { generatePaper } from "@/lib/questionGenerator";
import type {
  Board,
  CapturedPage,
  Difficulty,
  DocumentType,
  GeneratedPaper,
  WorksheetConfig,
} from "@/lib/types";
import { PrintablePaper } from "@/components/PrintablePaper";

const STEPS = ["Setup", "Capture", "Generate", "Print"] as const;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CreateWizard() {
  const [step, setStep] = useState(0);
  const [board, setBoard] = useState<Board>("CBSE");
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState<string>(SUBJECTS[2]);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [documentType, setDocumentType] = useState<DocumentType>("worksheet");
  const [questionCount, setQuestionCount] = useState(10);
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [combinedText, setCombinedText] = useState("");
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const config: WorksheetConfig = useMemo(
    () => ({
      board,
      grade,
      subject,
      difficulty,
      documentType,
      title: title || undefined,
      questionCount,
    }),
    [board, grade, subject, difficulty, documentType, title, questionCount],
  );

  const ocrBusy = pages.some((p) => p.status === "processing");
  const hasText = combinedText.trim().length > 40;

  function syncTextFromPages(nextPages: CapturedPage[]) {
    const doneText = nextPages
      .filter((p) => p.status === "done" && p.extractedText)
      .map((p) => p.extractedText)
      .join("\n\n");
    setCombinedText(doneText);
  }

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setError("Please choose image files of textbook pages.");
      return;
    }
    setError(null);

    const newPages: CapturedPage[] = files.map((file) => ({
      id: uid(),
      file,
      previewUrl: URL.createObjectURL(file),
      extractedText: "",
      ocrProgress: 0,
      status: "pending",
    }));

    setPages((prev) => [...prev, ...newPages]);

    for (const page of newPages) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === page.id ? { ...p, status: "processing", ocrProgress: 0.1 } : p,
        ),
      );
      try {
        const text = await extractTextFromImage(page.file, (progress) => {
          setPages((prev) =>
            prev.map((p) =>
              p.id === page.id ? { ...p, ocrProgress: progress } : p,
            ),
          );
        });
        setPages((prev) => {
          const next = prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  status: "done" as const,
                  ocrProgress: 1,
                  extractedText: text,
                }
              : p,
          );
          queueMicrotask(() => syncTextFromPages(next));
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not read this image.";
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? { ...p, status: "error", error: message }
              : p,
          ),
        );
      }
    }
  }

  function removePage(id: string) {
    const target = pages.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    syncTextFromPages(next);
  }

  function useDemoText() {
    setCombinedText(SAMPLE_TEXTBOOK_TEXT);
    setError(null);
    setStep(2);
  }

  function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = generatePaper(combinedText, config);
      setPaper(result);
      setShowAnswers(false);
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while framing questions.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function goNext() {
    setError(null);
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!hasText) {
        setError(
          "Add textbook photos (or use the demo lesson) so Padee can read the content.",
        );
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      handleGenerate();
    }
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-brand-deep sm:text-4xl">
            Create with Padee
          </h1>
        </div>
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                index === step
                  ? "bg-brand text-white"
                  : index < step
                    ? "bg-brand-soft text-brand-deep"
                    : "bg-white/70 text-ink-soft"
              }`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <section className="animate-fade-up space-y-8 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              School setup
            </h2>
            <p className="mt-1 text-ink-soft">
              Choose the board, grade, subject, and how hard the practice should
              feel.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
              Board
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {BOARDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBoard(item.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    board === item.id
                      ? "border-brand bg-brand-soft shadow-sm"
                      : "border-line bg-white hover:border-brand/40"
                  }`}
                >
                  <span className="font-display text-xl font-semibold text-brand-deep">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {item.blurb}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-ink-soft">
                Grade
              </span>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-ink-soft">
                Subject
              </span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
              Difficulty
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    difficulty === item.id
                      ? "border-accent bg-[#fff1ec]"
                      : "border-line bg-white hover:border-accent/40"
                  }`}
                >
                  <span className="font-display text-xl font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
              Output format
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCUMENT_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDocumentType(item.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    documentType === item.id
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-white hover:border-brand/40"
                  }`}
                >
                  <span className="flex items-center gap-2 font-display text-xl font-semibold">
                    <FileText className="h-5 w-5 text-brand" />
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-ink-soft">
                Number of questions
              </span>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand"
              >
                {QUESTION_COUNTS.map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-ink-soft">
                Custom title (optional)
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${subject} practice sheet`}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 font-semibold outline-none focus:border-brand"
              />
            </label>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="animate-fade-up space-y-6 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Capture textbook pages
            </h2>
            <p className="mt-1 text-ink-soft">
              Take clear photos of the lesson pages. Padee reads the text and
              uses it to frame questions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-4 font-bold text-white transition hover:bg-brand-deep"
            >
              <Camera className="h-5 w-5" /> Use camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-4 font-bold text-brand-deep transition hover:bg-brand-soft"
            >
              <Upload className="h-5 w-5" /> Upload photos
            </button>
            <button
              type="button"
              onClick={useDemoText}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-4 font-bold text-ink transition hover:bg-[#fff8e8]"
            >
              <BookOpenText className="h-5 w-5 text-sun" /> Try demo lesson
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void processFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void processFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {pages.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <figure
                  key={page.id}
                  className="overflow-hidden rounded-2xl border border-line bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.previewUrl}
                    alt="Textbook page preview"
                    className="h-40 w-full object-cover"
                  />
                  <figcaption className="space-y-2 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {page.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-brand">
                            <Check className="h-4 w-4" /> Text ready
                          </span>
                        )}
                        {page.status === "processing" && (
                          <span className="inline-flex items-center gap-1 text-ink-soft">
                            <LoaderCircle className="h-4 w-4 animate-spin" />{" "}
                            Reading… {Math.round(page.ocrProgress * 100)}%
                          </span>
                        )}
                        {page.status === "pending" && "Waiting…"}
                        {page.status === "error" && (
                          <span className="text-accent-deep">
                            {page.error || "Failed"}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePage(page.id)}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-paper-deep hover:text-accent"
                        aria-label="Remove page"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-ink-soft">
              Extracted lesson text
            </span>
            <textarea
              value={combinedText}
              onChange={(e) => setCombinedText(e.target.value)}
              rows={10}
              placeholder="Text from your textbook photos will appear here. You can edit it before generating questions."
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand"
            />
          </label>
          {ocrBusy && (
            <p className="text-sm font-semibold text-ink-soft">
              Still reading pages — you can continue once the text looks good.
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="animate-fade-up space-y-6 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[var(--shadow)] backdrop-blur sm:p-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Frame the questions
            </h2>
            <p className="mt-1 text-ink-soft">
              Review your setup, then let Padee build a{" "}
              {difficulty === "hard" ? "Difficult" : difficulty}{" "}
              {documentType === "question-paper"
                ? "question paper"
                : "worksheet"}{" "}
              from the lesson text.
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Board", board],
              ["Grade", `Grade ${grade}`],
              ["Subject", subject],
              [
                "Level",
                difficulty === "hard"
                  ? "Difficult"
                  : difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
              ],
              [
                "Format",
                documentType === "question-paper"
                  ? "Question Paper"
                  : "Worksheet",
              ],
              ["Questions", String(questionCount)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-line bg-white px-4 py-3"
              >
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {label}
                </dt>
                <dd className="mt-1 font-display text-lg font-semibold text-brand-deep">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="rounded-2xl border border-line bg-[#f8fffc] px-4 py-4 text-sm leading-relaxed text-ink-soft">
            <p className="font-bold text-brand-deep">Lesson preview</p>
            <p className="mt-2 line-clamp-6 whitespace-pre-wrap">
              {combinedText.slice(0, 500)}
              {combinedText.length > 500 ? "…" : ""}
            </p>
          </div>
        </section>
      )}

      {step === 3 && paper && (
        <section className="space-y-6">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 backdrop-blur">
            <div>
              <h2 className="font-display text-2xl font-semibold text-brand-deep">
                Ready to print
              </h2>
              <p className="text-sm text-ink-soft">
                {paper.questions.length} questions · {paper.totalMarks} marks
                total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowAnswers((v) => !v)}
                className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-brand-soft"
              >
                {showAnswers ? "Hide answers" : "Show answer key"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-deep"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaper(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep"
              >
                <Sparkles className="h-4 w-4" /> Regenerate
              </button>
            </div>
          </div>
          <PrintablePaper paper={paper} showAnswers={showAnswers} />
        </section>
      )}

      {error && (
        <p className="no-print mt-4 rounded-2xl border border-accent/30 bg-[#fff1ec] px-4 py-3 text-sm font-semibold text-accent-deep">
          {error}
        </p>
      )}

      {step < 3 && (
        <div className="no-print mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 font-bold text-ink-soft transition hover:bg-paper-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={generating || (step === 1 && ocrBusy)}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 font-bold text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Framing
                questions…
              </>
            ) : step === 2 ? (
              <>
                <Sparkles className="h-4 w-4" /> Generate paper
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
