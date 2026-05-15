import Link from "next/link";

export function ContentCta({
  title = "Start building on Interactive Ideas",
  description = "Take the idea out of your notes and put it into a place where progress, collaborators, and execution can form around it.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#111827]/80 p-6 shadow-[0_24px_80px_-56px_rgba(99,102,241,0.8)] md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Go to Interactive Ideas
        </Link>
      </div>
    </section>
  );
}
