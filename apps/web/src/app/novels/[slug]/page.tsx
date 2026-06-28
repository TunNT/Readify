import { BookOpen, Bookmark, Compass, Home, ListFilter } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { TrackNovelVisit } from "../../../components/library-actions";
import { BackButton } from "../../../components/novel-detail/back-button";
import { ReaderAccount } from "../../../components/reader-account";
import { SiteBrand } from "../../../components/site-settings";
import styles from "../../../components/novel-detail/detail.module.css";
import { ApiError, apiFetch, proxiedCoverUrl } from "../../../lib/api";
import { absoluteSiteUrl, getSiteSettings, jsonLd, pageMetadata } from "../../../lib/seo";
import type { ChaptersResponse, NovelResponse } from "../../../lib/types";

const getNovelData = cache((slug: string) => apiFetch<NovelResponse>(`/novels/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [{ data: novel }, settings] = await Promise.all([getNovelData(slug), getSiteSettings()]);
    return pageMetadata(settings, { title: novel.title, description: novel.description || `Read ${novel.title} online for free.`, path: `/novels/${novel.slug}`, image: novel.coverUrl });
  } catch { return {}; }
}

export default async function NovelDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ order?: "asc" | "desc" }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const order = query.order === "desc" ? "desc" : "asc";
  try {
    const [{ data: novel }, chapters] = await Promise.all([
      getNovelData(slug),
      apiFetch<ChaptersResponse>(`/novels/${encodeURIComponent(slug)}/chapters?page=1&limit=2000&order=${order}`)
    ]);
    const settings = await getSiteSettings();
    const structuredData = { "@context": "https://schema.org", "@type": "Book", name: novel.title, description: novel.description, url: absoluteSiteUrl(settings, `/novels/${novel.slug}`), author: { "@type": "Person", name: novel.authorName || "Unknown Author" }, image: novel.coverUrl ? absoluteSiteUrl(settings, novel.coverUrl) : undefined, genre: novel.categories.map((category) => category.name) };
    return <div className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <TrackNovelVisit novel={novel} />
      <header className={styles.header}><div className={styles.navContainer}><div className={styles.navButtons}><BackButton /><Link href="/" className={styles.navButton}><Home size={15} /> Home</Link></div><SiteBrand className={styles.logo}/><div className={styles.navButtons}><Link href="/library" className={styles.navButton}><Bookmark size={15} /> Library</Link><ReaderAccount /></div></div></header>
      <main className={styles.container}>
        <section className={styles.bookHeader}><div className={styles.bookCover}><img src={proxiedCoverUrl(novel.coverUrl)} alt={novel.title} /></div><div className={styles.bookInfo}><h1 className={styles.bookTitle}>{novel.title}</h1><p className={styles.bookAuthor}>By {novel.authorName || "Unknown Author"}</p><div className={styles.bookMeta}>{novel.categories.map((category) => <Link className={styles.metaItem} href={`/category/${category.slug}`} key={category.slug}>{category.name}</Link>)}{novel.tags?.map((tag) => <span className={styles.metaItem} key={`tag-${tag.slug}`}>{tag.name}</span>)}<span className={styles.metaItem}>{novel.rating.average.toFixed(1)} ★★★★★</span><span className={styles.metaItem}>{novel.status.toLowerCase()}</span><span className={styles.metaItem}>{novel.chapterCount} Chapters</span></div>{novel.description ? <p className={styles.descriptionText}>{novel.description}</p> : null}<div className={styles.actionButtons}>{novel.firstChapter ? <Link className={styles.primaryButton} href={`/novels/${novel.slug}/${novel.firstChapter.slug}`}>Start Reading</Link> : null}</div></div></section>
        {novel.description ? <section className={styles.bookDescription}><h2 className={styles.sectionTitle}>Synopsis</h2><p className={styles.descriptionText}>{novel.description}</p></section> : null}
        <section className={styles.chaptersContainer}><div className={styles.chaptersHeader}><h2 className={styles.sectionTitle}>Chapters ({novel.chapterCount})</h2><div className={styles.chaptersFilter}><Link className={`${styles.filterButton} ${order === "asc" ? styles.active : ""}`} href={`/novels/${slug}?order=asc`}>All</Link><button className={styles.filterButton} type="button">Free</button><Link className={`${styles.filterButton} ${order === "desc" ? styles.active : ""}`} href={`/novels/${slug}?order=desc`}>Latest</Link><Link className={styles.filterButton} href={`/novels/${slug}?order=${order === "asc" ? "desc" : "asc"}`}><ListFilter size={14} /> Sort</Link></div></div><ul className={styles.chaptersList}>{chapters.data.map((chapter) => <li className={styles.chapterItem} key={chapter.slug}><Link className={styles.chapterLink} href={`/novels/${slug}/${chapter.slug}`}><span className={styles.chapterTitle}>{chapter.title}</span><time className={styles.chapterDate}>{chapter.publishedAt?.slice(0,10) ?? "2026-06-05"}</time></Link></li>)}</ul></section>
      </main>
      <nav className={styles.bottomNav} aria-label="Mobile navigation"><div className={styles.bottomNavButtons}><Link className={`${styles.bottomNavButton} ${styles.active}`} href="/"><Home size={22} /><span>Home</span></Link><Link className={styles.bottomNavButton} href="/novels"><Compass size={22} /><span>Discover</span></Link><Link className={styles.bottomNavButton} href="/library"><BookOpen size={22} /><span>Library</span></Link></div></nav>
    </div>;
  } catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
}
