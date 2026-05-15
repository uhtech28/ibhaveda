import Link from "next/link";
import { articlePath, type Article } from "@/lib/articles";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={articlePath(article)}
      className="group block rounded-lg border border-white/10 bg-[#111827]/70 p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[#121A29]"
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
        {article.readTime}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-white group-hover:text-primary">
        {article.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {article.description}
      </p>
    </Link>
  );
}
