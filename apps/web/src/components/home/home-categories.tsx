import Link from "next/link";
import type { Novel } from "../../lib/types";
import styles from "./home.module.css";

export type HomeCategoryGroup = { slug: string; name: string; novels: Novel[] };
export function HomeCategories({ groups }: { groups: HomeCategoryGroup[] }) {
  return (
    <section className={styles.categories}>
      <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Browse by Category</h2><Link href="/categories" className={styles.viewMore}>View All Categories</Link></div>
      <div className={styles.categoryList}>{groups.map((group) => (
        <article className={styles.categoryItem} key={group.slug}>
          <h3 className={styles.categoryTitle}>{group.name}<Link href={`/category/${group.slug}`}>View All</Link></h3>
          <ul className={styles.categoryBooks}>{group.novels.map((novel) => <li key={novel.slug}><Link href={`/novels/${novel.slug}`}>{novel.title}</Link></li>)}</ul>
        </article>
      ))}</div>
    </section>
  );
}
