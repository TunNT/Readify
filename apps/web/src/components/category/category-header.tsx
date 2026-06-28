import Link from "next/link";
import { categoryContent, categoryNavigation } from "./category-source";
import styles from "./category.module.css";
import { ReaderAccount } from "../reader-account";
import { SiteBrand } from "../site-settings";

export function CategoryHeader() {
  return <nav className={styles.navbar} aria-label="Genre navigation"><SiteBrand className={styles.logo}/><div className={styles.navLinks}>{categoryNavigation.map((slug) => <Link href={`/category/${slug}`} key={slug}>{categoryContent[slug].name}</Link>)}</div><ReaderAccount /></nav>;
}
