import { NovelListView } from "../../components/novel-list-view";
import { SiteChrome } from "../../components/site-chrome";
import { apiFetch } from "../../lib/api";
import type { NovelListResponse } from "../../lib/types";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };
export const metadata:Metadata={title:"Search Novels",robots:{index:false,follow:true}};
export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = params.page ?? "1";
  const result = q
    ? await apiFetch<NovelListResponse>(`/search?q=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}&limit=20`)
    : { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false } };
  return <SiteChrome><NovelListView result={result} title={q ? `Search results for “${q}”` : "Search Novels"} description={q ? undefined : "Enter a title, author, or keyword in the search field."} pathname="/search" query={{ q }} /></SiteChrome>;
}
import type { Metadata } from "next";
