import { HomeCategories, type HomeCategoryGroup } from "../components/home/home-categories";
import { HomeFooter } from "../components/home/home-footer";
import { HomeHeader } from "../components/home/home-header";
import { HomeHistory } from "../components/home/home-history";
import { HomeNovelCard } from "../components/home/home-novel-card";
import { HomeSidebar } from "../components/home/home-sidebar";
import { homeCategorySource, recommendedNovelSlugs } from "../components/home/home-source";
import styles from "../components/home/home.module.css";
import { apiFetch } from "../lib/api";
import type { HomeResponse, Novel, NovelListResponse } from "../lib/types";
import { getSiteSettings, pageMetadata } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const metadata = pageMetadata(settings, { title: settings.seoTitle, description: settings.seoDescription, path: "/" });
  return { ...metadata, title: { absolute: settings.seoTitle } };
}

function buildCategoryGroups(novels: Novel[]): HomeCategoryGroup[] {
  const bySlug = new Map(novels.map((novel) => [novel.slug, novel]));
  return homeCategorySource.map((group) => ({ ...group, novels: group.novels.flatMap((slug) => bySlug.get(slug) ?? []) }));
}

export default async function HomePage() {
  const [{ data }, catalog] = await Promise.all([
    apiFetch<HomeResponse>("/home"),
    apiFetch<NovelListResponse>("/novels?page=1&limit=100&sort=chapters")
  ]);
  const novelsBySlug = new Map([...data.recommended, ...catalog.data].map((novel) => [novel.slug, novel]));
  const recommended = recommendedNovelSlugs.flatMap((slug) => novelsBySlug.get(slug) ?? []);
  const categoryGroups = buildCategoryGroups(catalog.data);

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
