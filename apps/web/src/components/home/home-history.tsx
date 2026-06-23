"use client";

import { useEffect, useState } from "react";
import type { Novel } from "../../lib/types";
import { clearStoredNovels, getStoredNovels, historyKey, libraryChangedEvent, type StoredNovel } from "../library-actions";
import { HomeNovelCard } from "./home-novel-card";
import styles from "./home.module.css";

function toNovel(item: StoredNovel): Novel {
  return { ...item, id: item.slug, description: "Continue reading where you left off.", status: "ONGOING", categories: [], viewCount: 0, rating: { average: 0, count: 0 } };
}

export function HomeHistory() {
  const [items, setItems] = useState<StoredNovel[]>([]);
  useEffect(() => { const load = () => setItems(getStoredNovels(historyKey)); load(); window.addEventListener(libraryChangedEvent, load); return () => window.removeEventListener(libraryChangedEvent, load); }, []);
  const clear = () => { clearStoredNovels(historyKey); setItems([]); };
  return (
    <section className={styles.history}>
      <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Reading History</h2><button type="button" className={styles.viewMoreButton} onClick={clear}>Clear History</button></div>
      {items.length ? <div className={`${styles.cardsGrid} ${styles.historyGrid}`}>{items.slice(0, 5).map((item) => <HomeNovelCard novel={toNovel(item)} key={item.slug} />)}</div> : <p className={styles.emptyHistory}>No reading history yet</p>}
    </section>
  );
}
