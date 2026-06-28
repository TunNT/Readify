import Link from "next/link";
import styles from "./home.module.css";
import { SiteBrand, SiteName } from "../site-settings";

const groups = [
  { title: "Quick Links", links: [["About Us", "/about"], ["Contact", "/contact"], ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"]] },
  { title: "Support", links: [["Help Center", "/help"], ["FAQ", "/faq"], ["Feedback", "/feedback"], ["Report Issue", "/report"]] },
  { title: "Connect With Us", links: [["Facebook", "#"], ["Twitter", "#"], ["Instagram", "#"], ["Pinterest", "#"]] }
];

export function HomeFooter() {
  return <footer className={styles.footer}><div className={styles.footerContent}><div className={styles.footerAbout}><SiteBrand className={styles.footerLogo}/><p><SiteName/> offers a curated selection of free novels for women. Discover romance, fantasy, werewolf, and more — read anywhere, anytime, completely free.</p></div>{groups.map((group) => <div className={styles.footerLinks} key={group.title}><h3>{group.title}</h3><ul>{group.links.map(([label, href]) => <li key={label}>{href === "#" ? <a href="#">{label}</a> : <Link href={href}>{label}</Link>}</li>)}</ul></div>)}</div><div className={styles.copyright}><p>© 2025 <SiteName/>. All rights reserved.</p></div></footer>;
}
