import type { GeneratedPaper } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function difficultyLabel(value: string): string {
  if (value === "hard") return "Difficult";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildPrintableHtml(
  paper: GeneratedPaper,
  showAnswers = false,
): string {
  const { config, questions, totalMarks, instructions, sourceSummary } = paper;
  const title =
    config.title?.trim() ||
    `${config.subject} ${config.documentType === "question-paper" ? "Question Paper" : "Worksheet"}`;

  const questionHtml = questions
    .map((question, index) => {
      const options = question.options
        ? `<ol type="A" style="margin:8px 0 0;padding-left:22px;">${question.options
            .map((option) => `<li>${escapeHtml(option)}</li>`)
            .join("")}</ol>`
        : "";

      const answerSpace =
        question.type === "long-answer"
          ? '<div style="height:90px;border:1px dashed #bbb;margin-top:10px;"></div>'
          : question.type === "short-answer"
            ? '<div style="height:54px;border:1px dashed #bbb;margin-top:10px;"></div>'
            : question.type === "match"
              ? '<div style="height:36px;border:1px dashed #bbb;margin-top:10px;"></div>'
              : '<div style="height:28px;border:1px dashed #bbb;margin-top:10px;"></div>';

      const marks =
        config.documentType === "question-paper"
          ? `<span style="float:right;font-weight:700;">[${question.marks}]</span>`
          : "";

      return `
        <div style="margin:0 0 22px;page-break-inside:avoid;">
          <div>
            ${marks}
            <strong>${index + 1}.</strong>
            <span style="white-space:pre-wrap;"> ${escapeHtml(question.prompt)}</span>
          </div>
          ${options}
          ${answerSpace}
        </div>
      `;
    })
    .join("");

  const answerHtml = showAnswers
    ? `
      <div style="page-break-before:always;margin-top:28px;border-top:2px solid #000;padding-top:18px;">
        <h2 style="margin:0 0 12px;font-size:18px;">Answer Key</h2>
        <ol style="padding-left:20px;margin:0;">
          ${questions
            .map(
              (q) =>
                `<li style="margin-bottom:10px;white-space:pre-wrap;"><em>${escapeHtml(q.type.replace("-", " "))}</em> — ${escapeHtml(q.answer)}</li>`,
            )
            .join("")}
        </ol>
      </div>
    `
    : "";

  const meta =
    config.documentType === "question-paper"
      ? `Level: <strong>${difficultyLabel(config.difficulty)}</strong> · Maximum Marks: <strong>${totalMarks}</strong> · Time: <strong>${Math.max(30, totalMarks * 3)} minutes</strong>`
      : `Level: <strong>${difficultyLabel(config.difficulty)}</strong>`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      @page { size: A4; margin: 14mm; }
      body {
        font-family: Georgia, "Times New Roman", serif;
        color: #111;
        font-size: 13px;
        line-height: 1.45;
        margin: 0;
      }
      h1 { font-size: 22px; margin: 8px 0 6px; }
      .muted { color: #555; font-size: 11px; }
    </style>
  </head>
  <body>
    <header style="text-align:center;border-bottom:2px solid #000;padding-bottom:12px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">
        ${escapeHtml(config.board)} · Grade ${config.grade}
      </div>
      <h1>${escapeHtml(title)}</h1>
      <div>${meta}</div>
      <div class="muted" style="margin-top:4px;">${escapeHtml(sourceSummary)}</div>
    </header>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin:14px 0 18px;">
      <div><div class="muted">Name</div><div style="border-bottom:1px solid #777;height:18px;"></div></div>
      <div><div class="muted">Class</div><div style="border-bottom:1px solid #777;height:18px;"></div></div>
      <div><div class="muted">Date</div><div style="border-bottom:1px solid #777;height:18px;"></div></div>
      <div><div class="muted">Roll No.</div><div style="border-bottom:1px solid #777;height:18px;"></div></div>
    </div>

    <section>
      <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Instructions</h2>
      <ol style="margin:0;padding-left:18px;">
        ${instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>

    <section style="margin-top:22px;">
      ${questionHtml}
    </section>

    ${answerHtml}

    <footer class="muted" style="margin-top:28px;border-top:1px solid #ccc;padding-top:8px;text-align:center;">
      Generated with Padee · For school practice use
    </footer>
  </body>
</html>
`;
}
