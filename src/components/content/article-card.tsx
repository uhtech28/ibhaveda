import React from "react";
import Link from "next/link";
import { articlePath, type Article } from "@/lib/articles";

export const ArticleCard = React.memo(({ article }: { article: Article }) => {
  return (
    <Link
      href={articlePath(article)}
      style={{
        transitionProperty: "transform, border-color, background-color",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDuration: "200ms",
      }}
      className="group block rounded-lg border border-white/10 bg-[#111827]/70 p-5 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[#121A29] will-change-transform"
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
});

ArticleCard.displayName = "ArticleCard";
