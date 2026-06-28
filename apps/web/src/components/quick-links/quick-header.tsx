import { Home } from "lucide-react";
import Link from "next/link";
import styles from "./quick-links.module.css";
import { ReaderAccount } from "../reader-account";
import { SiteBrand } from "../site-settings";

export function QuickHeader() {
  return <nav className={styles.navbar}><SiteBrand className={styles.logo}/><div className={styles.headerActions}><Link href="/" className={styles.homeLink}><Home size={16} /> Home</Link><ReaderAccount /></div></nav>;
}
