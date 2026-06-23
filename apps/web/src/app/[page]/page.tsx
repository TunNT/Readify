import { notFound } from "next/navigation";
import { QuickFooter } from "../../components/quick-links/quick-footer";
import { QuickHeader } from "../../components/quick-links/quick-header";
import { QuickPageContent } from "../../components/quick-links/quick-page-content";
import styles from "../../components/quick-links/quick-links.module.css";
import { ApiError, apiFetch } from "../../lib/api";
import type { ContentPageResponse } from "../../lib/types";

const supportedPages = new Set(["about", "faq", "contact", "privacy", "terms", "help", "feedback", "report"]);
export default async function StaticPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!supportedPages.has(page)) notFound();
  try {
    const { data } = await apiFetch<ContentPageResponse>(`/pages/${page}`);
    return <div className={styles.page}><QuickHeader /><main className={styles.container}><QuickPageContent html={data.contentHtml} page={page} /></main><QuickFooter /></div>;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
