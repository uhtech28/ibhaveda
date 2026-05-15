import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/content/category-hub";
import { absoluteUrl, getCategory } from "@/lib/articles";

const category = getCategory("future-of-entrepreneurship");

export const metadata: Metadata = {
  title: category?.seoTitle,
  description: category?.seoDescription,
  alternates: { canonical: absoluteUrl("/future-of-entrepreneurship") },
  openGraph: {
    title: category?.seoTitle,
    description: category?.seoDescription,
    url: absoluteUrl("/future-of-entrepreneurship"),
    type: "website",
  },
};

export default function FutureOfEntrepreneurshipPage() {
  if (!category) notFound();
  return <CategoryHub category={category} />;
}
