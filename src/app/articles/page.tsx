import type { Metadata } from "next";
import Link from "next/link";
import {
  absoluteUrl,
  articlePath,
  articles,
  categories,
  categoryPath,
  getCategory,
} from "@/lib/articles";
import { ArticleSearch, type SearchArticle } from "@/components/content/article-search";

export const metadata: Metadata = {
  title: "Articles | Interactive Ideas",
  description:
    "Explore Interactive Ideas articles on venture creation, startup execution, founder collaboration, open innovation, and the future of entrepreneurship.",
  alternates: {
    canonical: absoluteUrl("/articles"),
  },
  openGraph: {
    title: "Articles | Interactive Ideas",
    description:
      "Founder-focused articles from Interactive Ideas on building startups from raw ideas into executed ventures.",
    url: absoluteUrl("/articles"),
    type: "website",
  },
};

export default function ArticlesPage() {
  const searchableArticles: SearchArticle[] = articles.map((article) => ({
    title: article.title,
    description: article.description,
    readTime: article.readTime,
    href: articlePath(article),
    category: article.category,
    categoryTitle: getCategory(article.category)?.title ?? "Articles",
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-primary hover:text-primary/80">
          Interactive Ideas
        </Link>

        <header className="mt-8 max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            Articles for venture builders
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Sharp, founder-focused writing on moving from raw ideas to structured
            execution, useful collaboration, and better startup judgment.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={categoryPath(category)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-primary/50 hover:text-white"
              >
                {category.title}
              </Link>
            ))}
          </div>
        </section>

        <ArticleSearch articles={searchableArticles} />
      </div>
    </main>
  );
}
