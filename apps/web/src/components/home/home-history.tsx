"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { proxiedCoverUrl } from "../../lib/api";
import { clearStoredNovels, getStoredNovels, historyKey, libraryChangedEvent, type StoredNovel } from "../library-actions";
import styles from "./home.module.css";

function HistoryCard({ item }: { item: StoredNovel }) {
  const progress = Math.min(100, Math.max(0, item.progress ?? 0));
  return <article className={styles.novelCard}>
    <div className={styles.coverContainer}><Link href={`/novels/${item.slug}`}><img src={proxiedCoverUrl(item.coverUrl)} alt={item.title} className={styles.novelCover}/></Link></div>
    <div className={styles.cardContent}>
      <h3 className={styles.novelTitle}><Link href={`/novels/${item.slug}`}>{item.title}</Link></h3>
      <div className={styles.progressBar} role="progressbar" aria-label={`Reading progress for ${item.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span className={styles.progress} style={{width:`${progress}%`}}/></div>
      <Link href={`/novels/${item.slug}`} className={styles.readButton}>Continue Reading</Link>
    </div>
  </article>;
}

export function HomeHistory() {
  const [items, setItems] = useState<StoredNovel[]>([]);
  useEffect(() => { const load = () => setItems(getStoredNovels(historyKey)); load(); window.addEventListener(libraryChangedEvent, load); return () => window.removeEventListener(libraryChangedEvent, load); }, []);
  const clear = () => { clearStoredNovels(historyKey); setItems([]); };
  return (
    <section className={styles.history}>
      <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Reading History</h2><button type="button" className={styles.viewMoreButton} onClick={clear}>Clear History</button></div>
      <div className={`${styles.cardsGrid} ${styles.historyGrid}`}>{items.length ? items.slice(0, 5).map((item) => <HistoryCard item={item} key={item.slug}/>) : <p className={styles.emptyHistory}>No reading history yet</p>}</div>
    </section>
  );
}
