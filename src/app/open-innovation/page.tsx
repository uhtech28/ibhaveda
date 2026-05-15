import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/content/category-hub";
import { absoluteUrl, getCategory } from "@/lib/articles";

const category = getCategory("open-innovation");

export const metadata: Metadata = {
  title: category?.seoTitle,
  description: category?.seoDescription,
  alternates: { canonical: absoluteUrl("/open-innovation") },
  openGraph: {
    title: category?.seoTitle,
    description: category?.seoDescription,
    url: absoluteUrl("/open-innovation"),
    type: "website",
  },
};

export default function OpenInnovationPage() {
  if (!category) notFound();
  return <CategoryHub category={category} />;
}
