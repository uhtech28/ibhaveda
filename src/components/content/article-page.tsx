import Link from "next/link";
import Script from "next/script";
import {
  absoluteUrl,
  articlePath,
  categoryPath,
  getCategory,
  getRelatedArticles,
  type Article,
} from "@/lib/articles";
import { ContentCta } from "@/components/content/content-cta";

export function ArticlePage({ article }: { article: Article }) {
  const category = getCategory(article.category);
  const relatedArticles = getRelatedArticles(article);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: "Interactive Ideas",
    },
    publisher: {
      "@type": "Organization",
      name: "Interactive Ideas",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: absoluteUrl(articlePath(article)),
  };

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <Script
        id={`${article.slug}-article-schema`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl">
        <Link
          href={category ? categoryPath(category) : "/articles"}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          {category?.title ?? "Articles"}
        </Link>

        <header className="mt-8 border-b border-white/10 pb-10">
          <p className="text-sm text-slate-400">
            By Interactive Ideas · {article.readTime}
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
            {article.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            {article.description}
          </p>
        </header>

        <nav className="mt-8 rounded-lg border border-white/10 bg-[#111827]/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Table of contents
          </h2>
          <ol className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            {article.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:text-primary">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                {section.heading}
              </h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-slate-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.subsections?.map((subsection) => (
                <div key={subsection.heading} className="mt-8">
                  <h3 className="text-xl font-semibold text-white">
                    {subsection.heading}
                  </h3>
                  <div className="mt-3 space-y-4 text-base leading-8 text-slate-300">
                    {subsection.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-14">
          <ContentCta title="Turn ideas into execution" />
        </div>

        <section className="mt-14 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Related reading
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={`${related.category}-${related.slug}`}
                href={articlePath(related)}
                className="rounded-lg border border-white/10 bg-[#111827]/60 p-4 transition hover:border-primary/40 hover:bg-[#121A29]"
              >
                <p className="text-xs text-slate-400">{related.readTime}</p>
                <h3 className="mt-2 text-base font-semibold leading-6 text-white">
                  {related.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
