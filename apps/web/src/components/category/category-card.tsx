import Link from "next/link";
import { proxiedCoverUrl } from "../../lib/api";
import type { Novel } from "../../lib/types";
import styles from "./category.module.css";

export function CategoryCard({ novel }: { novel: Novel }) {
  const description = novel.description.trim() === "..." || !novel.description.trim() ? "A captivating story waiting for you to discover." : novel.description;
  return <article className={styles.novelCard}><div className={styles.coverContainer}><Link href={`/novels/${novel.slug}`}><img className={styles.novelCover} src={proxiedCoverUrl(novel.coverUrl)} alt={novel.title} loading="lazy" /></Link></div><div className={styles.cardContent}><h2 className={styles.novelTitle}><Link href={`/novels/${novel.slug}`}>{novel.title}</Link></h2><p className={styles.novelDesc}>{description}</p><div className={styles.tags}>{novel.categories.map((category) => <span className={styles.tag} key={category.slug}>{category.name}</span>)}</div><div className={styles.cardFooter}><Link className={styles.readButton} href={`/novels/${novel.slug}`}>Read Now</Link><time className={styles.updateDate}>{novel.updatedAt?.slice(0,10) ?? "2026-06-05"}</time></div></div></article>;
}
