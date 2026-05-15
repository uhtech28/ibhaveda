import Link from "next/link";
import {
  categories,
  categoryPath,
  getCategoryArticles,
  type Category,
} from "@/lib/articles";
import { ArticleCard } from "@/components/content/article-card";
import { ContentCta } from "@/components/content/content-cta";

export function CategoryHub({ category }: { category: Category }) {
  const categoryArticles = getCategoryArticles(category.slug);
  const peerCategories = categories.filter((item) => item.slug !== category.slug);

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/articles" className="text-sm font-medium text-primary hover:text-primary/80">
          Articles
        </Link>

        <header className="mt-8 max-w-3xl">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            {category.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            {category.description}
          </p>
        </header>

        <section className="mt-10 rounded-lg border border-white/10 bg-[#111827]/60 p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Research for builders before the company is obvious
          </h2>
          <p className="mt-4 leading-7 text-slate-300">{category.intro}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Articles
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Practical pieces from Interactive Ideas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {categoryArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Explore adjacent work</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {peerCategories.map((item) => (
              <Link
                key={item.slug}
                href={categoryPath(item)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-primary/50 hover:text-white"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-12">
          <ContentCta
            title="Start from an idea, move toward a venture"
            description="Interactive Ideas gives early founders a place to shape ideas, invite contribution, and turn scattered momentum into visible progress."
          />
        </div>
      </div>
    </main>
  );
}
