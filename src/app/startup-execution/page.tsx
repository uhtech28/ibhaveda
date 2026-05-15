import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/content/category-hub";
import { absoluteUrl, getCategory } from "@/lib/articles";

const category = getCategory("startup-execution");

export const metadata: Metadata = {
  title: category?.seoTitle,
  description: category?.seoDescription,
  alternates: { canonical: absoluteUrl("/startup-execution") },
  openGraph: {
    title: category?.seoTitle,
    description: category?.seoDescription,
    url: absoluteUrl("/startup-execution"),
    type: "website",
  },
};

export default function StartupExecutionPage() {
  if (!category) notFound();
  return <CategoryHub category={category} />;
}
