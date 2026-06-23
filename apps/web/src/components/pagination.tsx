import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { PaginationMeta } from "../lib/types";

export function Pagination({ meta, pathname, query = {}, pageParam = "page" }: { meta: PaginationMeta; pathname: string; query?: Record<string, string | undefined>; pageParam?: string }) {
  if (meta.totalPages <= 1) return null;
  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
    params.set(pageParam, String(page));
    return `${pathname}?${params.toString()}`;
  };
  return (
    <nav className="pagination" aria-label="Pagination">
      {meta.hasPreviousPage ? <Link href={hrefFor(meta.page - 1)}><ChevronLeft size={17} /> Previous</Link> : <span aria-disabled="true"><ChevronLeft size={17} /> Previous</span>}
      <strong>Page {meta.page} of {meta.totalPages}</strong>
      {meta.hasNextPage ? <Link href={hrefFor(meta.page + 1)}>Next <ChevronRight size={17} /></Link> : <span aria-disabled="true">Next <ChevronRight size={17} /></span>}
    </nav>
  );
}
