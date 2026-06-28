import Link from "next/link";
import { categoryContent, categoryNavigation } from "./category-source";
import styles from "./category.module.css";
import { SiteBrand, SiteName } from "../site-settings";

export function CategoryFooter() {
  return <footer className={styles.footer}><div className={styles.footerInner}><div><SiteBrand className={styles.footerBrand}/><p className={styles.footerDesc}>Your free destination for romance and fantasy novels. No subscription needed.</p></div><div className={styles.footerLinks}><h2>Genres</h2><ul>{categoryNavigation.map((slug) => <li key={slug}><Link href={`/category/${slug}`}>{categoryContent[slug].name}{slug === "werewolf" || slug === "alpha" ? " Romance" : slug === "billionaire" ? " CEO" : ""}</Link></li>)}</ul></div><div className={styles.footerLinks}><h2>Quick Links</h2><ul><li><Link href="/">Home</Link></li><li><Link href="/about">About Us</Link></li><li><Link href="/privacy">Privacy Policy</Link></li><li><Link href="/terms">Terms of Service</Link></li><li><Link href="/contact">Contact</Link></li></ul></div></div><div className={styles.footerBottom}>© 2025 <SiteName/>. All rights reserved. Free romance novels for women.</div></footer>;
}
