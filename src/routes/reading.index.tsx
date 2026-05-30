import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { READING_TESTS } from "@/services/reading-data";
import { BookOpen, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/reading/")({
  component: ReadingMenu,
});

function ReadingMenu() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          eyebrow="Reading Practice"
          title="Select a Reading Test"
          description="Choose an IELTS reading passage below to begin your practice."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {READING_TESTS.map((test) => (
            <Link
              key={test.id}
              to="/reading/$testId"
              params={{
                testId: test.id,
              }}
              search={{ from: "/reading" }}
              className="rounded-2xl border border-border bg-card p-6 hover:border-accent transition-colors group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="size-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <BookOpen className="size-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2 line-clamp-2">
                  {test.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {test.subtitle}
                </p>
              </div>
              <div className="mt-6 text-sm font-semibold text-accent flex items-center gap-1">
                Start practice{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}