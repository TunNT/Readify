import Link from "next/link";
import styles from "./quick-links.module.css";
import { SiteName } from "../site-settings";

export function QuickFooter() {
  return <footer className={styles.footer}><div className={styles.footerContent}><div className={styles.footerLinks}><h2>Quick Links</h2><ul><li><Link href="/">Home</Link></li><li><Link href="#">About Us</Link></li><li><Link href="#">Contact</Link></li><li><Link href="#">Privacy Policy</Link></li><li><Link href="#">Terms of Service</Link></li></ul></div><div className={styles.footerLinks}><h2>Support</h2><ul><li><Link href="#">Help Center</Link></li><li><Link href="#">FAQ</Link></li><li><Link href="#">Feedback</Link></li><li><Link href="#">Report Issue</Link></li></ul></div></div><div className={styles.copyright}>© 2025 <SiteName/>. All rights reserved.</div></footer>;
}
