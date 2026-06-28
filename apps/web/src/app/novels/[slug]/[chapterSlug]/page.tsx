import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ReaderExperience } from "../../../../components/reader-experience";
import { ApiError, apiFetch } from "../../../../lib/api";
import { absoluteSiteUrl, getSiteSettings, jsonLd, pageMetadata } from "../../../../lib/seo";
import type { ChapterResponse, ChaptersResponse, NovelResponse } from "../../../../lib/types";

const getChapterData = cache((slug: string, chapterSlug: string) => apiFetch<ChapterResponse>(`/novels/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapterSlug)}`));
const getNovelData = cache((slug: string) => apiFetch<NovelResponse>(`/novels/${encodeURIComponent(slug)}`));

export async function generateMetadata({ params }: { params: Promise<{ slug: string; chapterSlug: string }> }): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  try {
    const [{ data: chapter }, { data: novel }, settings] = await Promise.all([getChapterData(slug, chapterSlug), getNovelData(slug), getSiteSettings()]);
    return pageMetadata(settings, { title: `${chapter.title} - ${novel.title}`, description: chapter.excerpt || `Read ${chapter.title} of ${novel.title} online.`, path: `/novels/${slug}/${chapterSlug}`, image: novel.coverUrl, type: "article" });
  } catch { return {}; }
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; chapterSlug: string }> }) {
  const { slug, chapterSlug } = await params;
  try {
    const [{ data: chapter }, { data: novel }] = await Promise.all([
      getChapterData(slug, chapterSlug),
      getNovelData(slug)
    ]);
    const page = Math.ceil(chapter.number / 100);
    const { data: chapterList } = await apiFetch<ChaptersResponse>(`/novels/${encodeURIComponent(slug)}/chapters?page=${page}&limit=100&order=asc`);
    const settings = await getSiteSettings();
    const structuredData = { "@context": "https://schema.org", "@type": "Chapter", name: chapter.title, position: chapter.number, isPartOf: { "@type": "Book", name: novel.title, url: absoluteSiteUrl(settings, `/novels/${novel.slug}`) }, url: absoluteSiteUrl(settings, `/novels/${slug}/${chapterSlug}`) };
    return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} /><ReaderExperience chapter={chapter} chapterList={chapterList} novelInfo={novel} /></>;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
