import Link from "next/link";
import { proxiedCoverUrl } from "../../lib/api";
import type { Novel } from "../../lib/types";
import styles from "./home.module.css";

export function HomeNovelCard({ novel, featured = false, actionLabel = "Read Now" }: { novel: Novel; featured?: boolean; actionLabel?: string }) {
  return (
    <article className={`${styles.novelCard} ${featured ? styles.featuredCard : ""}`}>
      <div className={styles.coverContainer}>
        <Link href={`/novels/${novel.slug}`}><img src={proxiedCoverUrl(novel.coverUrl)} alt={novel.title} className={styles.novelCover} /></Link>
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.novelTitle}><Link href={`/novels/${novel.slug}`}>{novel.title}</Link></h3>
        <p className={styles.novelDesc}>{novel.description || "..."}</p>
        <div className={styles.tags}>{novel.categories.slice(0, 3).map((category) => <span className={styles.tag} key={category.slug}>{category.name}</span>)}</div>
        <div className={styles.cardFooter}>
          <Link href={`/novels/${novel.slug}`} className={styles.readButton}>{actionLabel}</Link>
          <time className={styles.updateDate}>{novel.updatedAt?.slice(0, 10) ?? "2026-06-05"}</time>
        </div>
      </div>
    </article>
  );
}
