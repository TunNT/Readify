import { NovelListView } from "../../components/novel-list-view";
import { SiteChrome } from "../../components/site-chrome";
import { apiFetch } from "../../lib/api";
import type { NovelListResponse } from "../../lib/types";

type Props = { searchParams: Promise<{ page?: string; sort?: string }> };
export default async function NovelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = params.page ?? "1";
  const sort = params.sort ?? "chapters";
  const result = await apiFetch<NovelListResponse>(`/novels?page=${encodeURIComponent(page)}&limit=20&sort=${encodeURIComponent(sort)}`);
  return <SiteChrome><NovelListView result={result} title="All Novels" description="Explore every story in the WeAreNovelArk library." pathname="/novels" query={{ sort }} /></SiteChrome>;
}
