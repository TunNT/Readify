import { notFound } from "next/navigation";
import { ReaderExperience } from "../../../../components/reader-experience";
import { ApiError, apiFetch } from "../../../../lib/api";
import type { ChapterResponse, ChaptersResponse, NovelResponse } from "../../../../lib/types";

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; chapterSlug: string }> }) {
  const { slug, chapterSlug } = await params;
  try {
    const [{ data: chapter }, { data: novel }] = await Promise.all([
      apiFetch<ChapterResponse>(`/novels/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(chapterSlug)}`),
      apiFetch<NovelResponse>(`/novels/${encodeURIComponent(slug)}`)
    ]);
    const page = Math.ceil(chapter.number / 100);
    const { data: chapterList } = await apiFetch<ChaptersResponse>(`/novels/${encodeURIComponent(slug)}/chapters?page=${page}&limit=100&order=asc`);
    return <ReaderExperience chapter={chapter} chapterList={chapterList} novelInfo={novel} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
