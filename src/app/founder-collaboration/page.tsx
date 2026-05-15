import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/content/category-hub";
import { absoluteUrl, getCategory } from "@/lib/articles";

const category = getCategory("founder-collaboration");

export const metadata: Metadata = {
  title: category?.seoTitle,
  description: category?.seoDescription,
  alternates: { canonical: absoluteUrl("/founder-collaboration") },
  openGraph: {
    title: category?.seoTitle,
    description: category?.seoDescription,
    url: absoluteUrl("/founder-collaboration"),
    type: "website",
  },
};

export default function FounderCollaborationPage() {
  if (!category) notFound();
  return <CategoryHub category={category} />;
}
