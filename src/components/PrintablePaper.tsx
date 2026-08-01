"use client";

import type { GeneratedPaper } from "@/lib/types";

function difficultyLabel(value: string): string {
  if (value === "hard") return "Difficult";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function PrintablePaper({
  paper,
  showAnswers = false,
}: {
  paper: GeneratedPaper;
  showAnswers?: boolean;
}) {
  const { config, questions, totalMarks, instructions, sourceSummary } = paper;
  const title =
    config.title?.trim() ||
    `${config.subject} ${config.documentType === "question-paper" ? "Question Paper" : "Worksheet"}`;

  return (
    <article className="print-sheet mx-auto w-full max-w-[210mm] bg-white px-6 py-8 text-black shadow-[var(--shadow)] sm:px-10 sm:py-10">
      <header className="border-b-2 border-black pb-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">
          {config.board} · Grade {config.grade}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm">
          Level: <strong>{difficultyLabel(config.difficulty)}</strong>
          {config.documentType === "question-paper" && (
            <>
              {" "}
              · Maximum Marks: <strong>{totalMarks}</strong> · Time:{" "}
              <strong>{Math.max(30, totalMarks * 3)} minutes</strong>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-neutral-600">{sourceSummary}</p>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Name
          </span>
          <span className="border-b border-neutral-400 pb-1">&nbsp;</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Class
          </span>
          <span className="border-b border-neutral-400 pb-1">&nbsp;</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Date
          </span>
          <span className="border-b border-neutral-400 pb-1">&nbsp;</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Roll No.
          </span>
          <span className="border-b border-neutral-400 pb-1">&nbsp;</span>
        </label>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Instructions
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
          {instructions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="mt-8 space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                <span className="font-bold">{index + 1}. </span>
                {question.prompt}
              </p>
              {config.documentType === "question-paper" && (
                <span className="shrink-0 text-sm font-semibold">
                  [{question.marks}]
                </span>
              )}
            </div>

            {question.options && (
              <ol className="mt-3 grid gap-2 pl-1 text-sm sm:grid-cols-2">
                {question.options.map((option, optIndex) => (
                  <li key={option} className="flex gap-2">
                    <span className="font-semibold">
                      {String.fromCharCode(65 + optIndex)}.
                    </span>
                    <span>{option}</span>
                  </li>
                ))}
              </ol>
            )}

            {(question.type === "short-answer" ||
              question.type === "long-answer" ||
              question.type === "fill-blank" ||
              question.type === "one-word" ||
              question.type === "true-false") && (
              <div
                className={`mt-3 rounded border border-dashed border-neutral-300 ${
                  question.type === "long-answer"
                    ? "h-28"
                    : question.type === "short-answer"
                      ? "h-16"
                      : "h-8"
                }`}
              />
            )}

            {question.type === "match" && (
              <div className="mt-3 h-10 rounded border border-dashed border-neutral-300" />
            )}
          </div>
        ))}
      </section>

      {showAnswers && (
        <section className="answer-key mt-12 border-t-2 border-black pt-6">
          <h2 className="font-display text-xl font-semibold">Answer Key</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            {questions.map((question) => (
              <li key={`ans-${question.id}`} className="whitespace-pre-wrap">
                <span className="font-semibold uppercase text-neutral-500">
                  {question.type.replace("-", " ")} ·{" "}
                </span>
                {question.answer}
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-10 border-t border-neutral-300 pt-3 text-center text-xs text-neutral-500">
        Generated with Padee · For school practice use
      </footer>
    </article>
  );
}
