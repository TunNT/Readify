import { Home } from "lucide-react";
import Link from "next/link";
import styles from "./quick-links.module.css";
import { ReaderAccount } from "../reader-account";

export function QuickHeader() {
  return <nav className={styles.navbar}><Link href="/" className={styles.logo}>Good<span>Luck</span>Ark</Link><div className={styles.headerActions}><Link href="/" className={styles.homeLink}><Home size={16} /> Home</Link><ReaderAccount /></div></nav>;
}
