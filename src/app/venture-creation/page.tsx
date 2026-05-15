import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryHub } from "@/components/content/category-hub";
import { absoluteUrl, getCategory } from "@/lib/articles";

const category = getCategory("venture-creation");

export const metadata: Metadata = {
  title: category?.seoTitle,
  description: category?.seoDescription,
  alternates: { canonical: absoluteUrl("/venture-creation") },
  openGraph: {
    title: category?.seoTitle,
    description: category?.seoDescription,
    url: absoluteUrl("/venture-creation"),
    type: "website",
  },
};

export default function VentureCreationPage() {
  if (!category) notFound();
  return <CategoryHub category={category} />;
}
