import { BookOpen, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryCard } from "../../../components/category/category-card";
import { CategoryFooter } from "../../../components/category/category-footer";
import { CategoryHeader } from "../../../components/category/category-header";
import { categoryContent } from "../../../components/category/category-source";
import styles from "../../../components/category/category.module.css";
import { ApiError, apiFetch } from "../../../lib/api";
import type { Novel, NovelListResponse } from "../../../lib/types";
import { getSiteSettings, pageMetadata } from "../../../lib/seo";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const settings=await getSiteSettings();const content=categoryContent[slug]??{name:slug.charAt(0).toUpperCase()+slug.slice(1),description:`Explore free ${slug} novels and find your next story.`};return pageMetadata(settings,{title:`${content.name} Novels`,description:content.description,path:`/category/${slug}`});}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let novels: Novel[] = [];
  let categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  try {
    const result = await apiFetch<NovelListResponse>(`/categories/${encodeURIComponent(slug)}?page=1&limit=100`);
    novels = result.data;
    categoryName = result.category?.name ?? categoryName;
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }
  const content = categoryContent[slug] ?? {
    name: categoryName,
    description: `Explore free ${categoryName} novels and find your next story.`
  };

  return (
    <div className={styles.page}>
      <CategoryHeader />
      <header className={styles.pageHeader}>
        <h1><BookOpen size={32} /> {content.name} Novels</h1>
        <p>{content.description}</p>
        <span className={styles.novelCount}>{novels.length} Novels</span>
      </header>
      <main className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/"><Home size={13} /> Home</Link> › <Link href="/categories">Categories</Link> › {content.name}
        </nav>
        <div className={styles.cardsGrid}>{novels.map((novel) => <CategoryCard novel={novel} key={novel.id} />)}</div>
      </main>
      <CategoryFooter />
    </div>
  );
}
