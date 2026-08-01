import Link from "next/link";
import {
  Camera,
  Printer,
  Sparkles,
  Layers3,
  GraduationCap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        <section className="relative grid min-h-[78vh] items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="relative z-10 max-w-xl">
            <p className="animate-fade-up font-display text-5xl font-semibold leading-[0.95] tracking-tight text-brand-deep sm:text-6xl md:text-7xl">
              Padee
            </p>
            <h1 className="animate-fade-up-delay mt-5 max-w-lg font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
              Turn textbook pages into printable practice.
            </h1>
            <p className="animate-fade-up-delay-2 mt-4 max-w-md text-lg leading-relaxed text-ink-soft">
              Snap a lesson from CBSE, ICSE, or Matriculation books (Grades
              1–8), then generate Easy, Medium, or Difficult worksheets and
              question papers ready to print.
            </p>
            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="pulse-ring relative inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_14px_30px_rgba(232,93,59,0.3)] transition hover:bg-accent-deep"
              >
                Start creating
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-2xl border border-line bg-white/70 px-6 py-3.5 text-base font-bold text-brand-deep backdrop-blur transition hover:bg-brand-soft"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="relative animate-fade-up-delay">
            <div className="animate-float absolute -left-4 top-8 hidden h-28 w-28 rounded-full bg-sun/40 blur-2xl sm:block" />
            <div className="absolute -right-6 bottom-10 h-36 w-36 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-brand to-brand-deep p-1 shadow-[var(--shadow)]">
              <div className="relative overflow-hidden rounded-[1.85rem] bg-[linear-gradient(145deg,#0f6b5c_0%,#147a68_40%,#0a4f44_100%)] px-6 py-8 text-white sm:px-8 sm:py-10">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 35%), radial-gradient(circle at 80% 70%, rgba(240,180,41,0.35), transparent 40%)",
                  }}
                />
                <div className="relative">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                    From page to paper
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold leading-snug sm:text-4xl">
                    Capture. Frame questions. Print.
                  </p>
                  <ul className="mt-8 space-y-4 text-sm sm:text-base">
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Camera className="h-4 w-4" />
                      </span>
                      <span>
                        Photograph textbook pages — OCR reads the lesson text.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Layers3 className="h-4 w-4" />
                      </span>
                      <span>
                        Pick Easy, Medium, or Difficult question sets.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Printer className="h-4 w-4" />
                      </span>
                      <span>
                        Print A4 worksheets or exam-style question papers.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mt-6 border-t border-line/70 pt-14"
        >
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-brand-deep sm:text-4xl">
              Built for school study at home
            </h2>
            <p className="mt-3 text-lg text-ink-soft">
              One clear path from your child&apos;s textbook to a printable
              practice sheet — no complicated setup.
            </p>
          </div>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Choose board & grade",
                body: "CBSE, ICSE, or Matriculation — Grades 1 to 8, with subject and difficulty.",
              },
              {
                icon: Camera,
                title: "Snap the lesson",
                body: "Upload or capture textbook pages. Padee extracts the text for framing questions.",
              },
              {
                icon: Sparkles,
                title: "Print & practice",
                body: "Generate a worksheet or question paper, review answers, then print on A4.",
              },
            ].map((step, index) => (
              <li key={step.title} className="relative">
                <p className="font-display text-5xl font-semibold text-brand/15">
                  0{index + 1}
                </p>
                <step.icon className="mt-2 h-6 w-6 text-accent" />
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-ink-soft leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 rounded-[2rem] bg-brand px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold">
                Ready for today&apos;s lesson?
              </h2>
              <p className="mt-2 max-w-xl text-white/80">
                Create an Easy warm-up, a Medium revision sheet, or a Difficult
                challenge paper in minutes.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-accent px-6 py-3.5 font-bold text-white transition hover:bg-accent-deep"
            >
              Open Padee
            </Link>
          </div>
        </section>
      </main>
      <footer className="no-print mx-auto w-full max-w-6xl px-5 py-8 text-sm text-ink-soft sm:px-8">
        Padee · Study worksheets for Matriculation, CBSE & ICSE · Grades 1–8
      </footer>
    </>
  );
}
