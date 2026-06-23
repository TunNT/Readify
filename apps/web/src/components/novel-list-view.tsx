import { SearchX } from "lucide-react";
import { NovelCard } from "./novel-card";
import { Pagination } from "./pagination";
import type { NovelListResponse } from "../lib/types";

export function NovelListView({ result, title, description, pathname, query }: {
  result: NovelListResponse;
  title: string;
  description?: string;
  pathname: string;
  query?: Record<string, string | undefined>;
}) {
  return (
    <main className="siteContainer listingPage">
      <header className="pageHeader">
        <div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
        <span>{result.meta.total} novels</span>
      </header>
      {result.data.length ? (
        <div className="novelGrid listingGrid">{result.data.map((novel) => <NovelCard novel={novel} key={novel.id} />)}</div>
      ) : (
        <div className="emptyState"><SearchX size={34} /><h2>No novels found</h2><p>Try another title or browse a different category.</p></div>
      )}
      <Pagination meta={result.meta} pathname={pathname} query={query} />
    </main>
  );
}
