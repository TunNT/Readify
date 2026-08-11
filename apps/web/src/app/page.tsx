import { HomeCategories, type HomeCategoryGroup } from "../components/home/home-categories";
import { HomeFooter } from "../components/home/home-footer";
import { HomeHeader } from "../components/home/home-header";
import { HomeHistory } from "../components/home/home-history";
import { HomeNovelCard } from "../components/home/home-novel-card";
import { HomeSidebar } from "../components/home/home-sidebar";
import { recommendedNovelSlugs } from "../components/home/home-source";
import styles from "../components/home/home.module.css";
import { apiFetch } from "../lib/api";
import type { Category, HomeResponse, Novel, NovelListResponse } from "../lib/types";
import { getSiteSettings, pageMetadata } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const metadata = pageMetadata(settings, { title: settings.seoTitle, description: settings.seoDescription, path: "/" });
  return { ...metadata, title: { absolute: settings.seoTitle } };
}

function buildCategoryGroups(novels: Novel[], dbCategories: Category[]): HomeCategoryGroup[] {
  return dbCategories
    .filter((cat) => cat.novelCount && cat.novelCount > 0)
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      novels: novels
        .filter((novel) => novel.categories.some((c) => c.slug === cat.slug))
        .slice(0, 5)
    }));
}

export default async function HomePage() {
  const [{ data }, catalog] = await Promise.all([
    apiFetch<HomeResponse>("/home"),
    apiFetch<NovelListResponse>("/novels?page=1&limit=100&sort=chapters")
  ]);
  const novelsBySlug = new Map([...data.recommended, ...catalog.data].map((novel) => [novel.slug, novel]));
  const hardcodedRecommended = recommendedNovelSlugs.flatMap((slug) => novelsBySlug.get(slug) ?? []);
  const fallbackRecommended = catalog.data.filter((novel) => !(recommendedNovelSlugs as readonly string[]).includes(novel.slug));
  const recommended = [...hardcodedRecommended, ...fallbackRecommended].slice(0, 12);
  const categoryGroups = buildCategoryGroups(catalog.data, data.categories);

  return (
    <div className={styles.page}>
      <HomeHeader />
      <main className={styles.container}>
        <div className={styles.pageLayout}>
          <div className={styles.mainContent}>
            <HomeHistory />
            <section>
              <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Recommended For You</h2></div>
              <div className={styles.cardsGrid}>{recommended.map((novel) => <HomeNovelCard novel={novel} key={novel.id} />)}</div>
            </section>
            <section className={styles.featured}>
              <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Featured Novels</h2><a href="#" className={styles.viewMore}>View All</a></div>
              <div className={`${styles.cardsGrid} ${styles.featuredGrid}`}>{data.featured.map((novel) => <HomeNovelCard novel={novel} featured key={novel.id} />)}</div>
            </section>
            <HomeCategories groups={categoryGroups} />
          </div>
          <HomeSidebar data={data} />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
import type { Metadata } from "next";
