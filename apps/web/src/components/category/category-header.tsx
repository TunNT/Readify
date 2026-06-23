import Link from "next/link";
import { categoryContent, categoryNavigation } from "./category-source";
import styles from "./category.module.css";
import { ReaderAccount } from "../reader-account";

export function CategoryHeader() {
  return <nav className={styles.navbar} aria-label="Genre navigation"><Link href="/" className={styles.logo}>Good<span>Luck</span>Ark</Link><div className={styles.navLinks}>{categoryNavigation.map((slug) => <Link href={`/category/${slug}`} key={slug}>{categoryContent[slug].name}</Link>)}</div><ReaderAccount /></nav>;
}
