import { NovelListView } from "../../components/novel-list-view";
import { SiteChrome } from "../../components/site-chrome";
import { apiFetch } from "../../lib/api";
import type { NovelListResponse } from "../../lib/types";
import { getSiteSettings, pageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> { const settings=await getSiteSettings(); return pageMetadata(settings,{title:"All Novels",description:`Explore every story in the ${settings.siteName} library.`,path:"/novels"}); }

type Props = { searchParams: Promise<{ page?: string; sort?: string }> };
export default async function NovelsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = params.page ?? "1";
  const sort = params.sort ?? "chapters";
  const result = await apiFetch<NovelListResponse>(`/novels?page=${encodeURIComponent(page)}&limit=20&sort=${encodeURIComponent(sort)}`);
  const settings=await getSiteSettings();
  return <SiteChrome><NovelListView result={result} title="All Novels" description={`Explore every story in the ${settings.siteName} library.`} pathname="/novels" query={{ sort }} /></SiteChrome>;
}
import type { Metadata } from "next";
