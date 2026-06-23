import { Search } from "lucide-react";
import Link from "next/link";
import styles from "./home.module.css";
import { ReaderAccount } from "../reader-account";

export function HomeHeader() {
  return (
    <nav className={styles.navbar} aria-label="Homepage navigation">
      <Link href="/" className={styles.logo}>WeAreNovel<span>Ark</span></Link>
      <div className={styles.navRight}>
        <form className={styles.searchBox} action="/search" role="search">
          <Search size={15} aria-hidden="true" />
          <input name="q" type="search" placeholder="Search novels..." aria-label="Search novels" maxLength={100} />
        </form>
        <div className={styles.userActions}>
          <ReaderAccount />
        </div>
      </div>
    </nav>
  );
}
