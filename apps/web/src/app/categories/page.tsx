import { Grid3X3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "../../components/site-chrome";
import { apiFetch } from "../../lib/api";
import type { CategoriesResponse } from "../../lib/types";
import { getSiteSettings, pageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> { const settings=await getSiteSettings(); return pageMetadata(settings,{title:"Browse Categories",description:"Browse novels by genre and theme.",path:"/categories"}); }

export default async function CategoriesPage() {
  const { data } = await apiFetch<CategoriesResponse>("/categories");
  return (
    <SiteChrome><main className="siteContainer listingPage"><header className="pageHeader"><div><h1>Browse Categories</h1><p>Find a story by genre and theme.</p></div></header>
      <div className="allCategories">{data.map((category) => <Link href={`/category/${category.slug}`} key={category.slug}><Grid3X3 size={22} /><strong>{category.name}</strong><span>{category.novelCount} novels</span></Link>)}</div>
    </main></SiteChrome>
  );
}
