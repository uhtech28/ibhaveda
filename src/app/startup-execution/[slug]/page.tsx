import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/content/article-page";
import {
  absoluteUrl,
  articlePath,
  articles,
  getArticle,
  getCategory,
} from "@/lib/articles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return articles
    .filter((article) => article.category === "startup-execution")
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("startup-execution", slug);
  const category = getCategory("startup-execution");

  if (!article) return {};

  return {
    title: `${article.title} | Interactive Ideas`,
    description: article.description,
    alternates: { canonical: absoluteUrl(articlePath(article)) },
    openGraph: {
      title: article.title,
      description: article.description,
      url: absoluteUrl(articlePath(article)),
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: category?.title,
    },
  };
}

export default async function StartupExecutionArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle("startup-execution", slug);

  if (!article) notFound();

  return <ArticlePage article={article} />;
}
