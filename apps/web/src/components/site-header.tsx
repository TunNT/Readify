import { BookOpen, Home, Library, Search } from "lucide-react";
import Link from "next/link";
import { ReaderAccount } from "./reader-account";
import { SiteBrand } from "./site-settings";

export function SiteHeader() {
  return (
    <>
      <header className="siteHeader">
        <div className="headerInner">
          <SiteBrand className="brand"/>
          <form className="searchForm" action="/search" role="search">
            <Search aria-hidden="true" size={17} />
            <input name="q" type="search" placeholder="Search novels..." aria-label="Search novels" maxLength={100} />
          </form>
          <nav className="desktopNav" aria-label="Primary navigation">
            <Link href="/novels"><BookOpen size={17} /> Novels</Link>
            <Link href="/library"><Library size={17} /> Library</Link>
          </nav>
          <ReaderAccount />
        </div>
      </header>
      <nav className="mobileNav" aria-label="Mobile navigation">
        <Link href="/"><Home size={20} /><span>Home</span></Link>
        <Link href="/novels"><BookOpen size={20} /><span>Novels</span></Link>
        <Link href="/search"><Search size={20} /><span>Search</span></Link>
        <Link href="/library"><Library size={20} /><span>Library</span></Link>
      </nav>
    </>
  );
}
