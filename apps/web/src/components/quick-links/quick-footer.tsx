import Link from "next/link";
import styles from "./quick-links.module.css";

export function QuickFooter() {
  return <footer className={styles.footer}><div className={styles.footerContent}><div className={styles.footerLinks}><h2>Quick Links</h2><ul><li><Link href="/">Home</Link></li><li><Link href="/about">About Us</Link></li><li><Link href="/contact">Contact</Link></li><li><Link href="/privacy">Privacy Policy</Link></li><li><Link href="/terms">Terms of Service</Link></li></ul></div><div className={styles.footerLinks}><h2>Support</h2><ul><li><Link href="/help">Help Center</Link></li><li><Link href="/faq">FAQ</Link></li><li><Link href="/feedback">Feedback</Link></li><li><Link href="/report">Report Issue</Link></li></ul></div></div><div className={styles.copyright}>© 2025 GoodLuckArk. All rights reserved.</div></footer>;
}
