import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/exams/")({
  head: () => ({
    meta: [
      { title: "Exams — PassAsistant" },
      {
        name: "description",
        content:
          "Choose between IELTS, TOEFL and TOEIC. Each section includes overview, practice and mock tests.",
      },
    ],
  }),
  component: Exams,
});

const exams = [
  {
    code: "ielts",
    name: "IELTS",
    desc: "Academic & General. 4 skills, band 0–9.",
    scale: "Band 9.0",
  },
  {
    code: "toefl",
    name: "TOEFL",
    desc: "iBT writing, integrated tasks, 0–30 per skill.",
    scale: "120 pts",
  },
  {
    code: "toeic",
    name: "TOEIC",
    desc: "Listening & Reading workplace English.",
    scale: "990 pts",
  },
];

function Exams() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="Exam library"
          title="Choose your exam."
          description="Each section includes an overview, practice materials and full timed mock tests."
        />
        <div className="grid md:grid-cols-3 gap-4">
          {exams.map((e) => (
            <Link
              key={e.code}
              to="/exams/$code"
              params={{ code: e.code }}
              className="rounded-2xl border border-border bg-card p-6 hover:border-accent transition-colors group"
            >
              <div className="flex items-baseline justify-between mb-3">
                <div className="text-2xl font-semibold tracking-tight">{e.name}</div>
                <div className="text-xs font-medium text-muted-foreground">{e.scale}</div>
              </div>
              <p className="text-sm text-muted-foreground">{e.desc}</p>
              <div className="mt-4 text-sm text-accent flex items-center gap-1">
                Open{" "}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
