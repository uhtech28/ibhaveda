"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CategorySlug } from "@/lib/articles";

export type SearchArticle = {
  title: string;
  description: string;
  readTime: string;
  href: string;
  categoryTitle: string;
  category: CategorySlug;
};

export function ArticleSearch({ articles }: { articles: SearchArticle[] }) {
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return articles;
    }

    return articles.filter((article) => {
      const haystack =
        `${article.title} ${article.categoryTitle} ${article.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [articles, query]);

  return (
    <section className="mt-8">
      <label htmlFor="article-search" className="sr-only">
        Search articles
      </label>
      <input
        id="article-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by title, category, or summary"
        className="h-11 w-full rounded-md border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {filteredArticles.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="rounded-lg border border-white/10 bg-[#111827]/70 p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[#121A29]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              {article.categoryTitle} · {article.readTime}
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {article.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {article.description}
            </p>
          </Link>
        ))}
      </div>

      {filteredArticles.length === 0 ? (
        <p className="mt-8 rounded-lg border border-white/10 bg-[#111827]/70 p-5 text-sm text-slate-300">
          No articles match that search yet.
        </p>
      ) : null}
    </section>
  );
}
