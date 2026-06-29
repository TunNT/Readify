"use client";

import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, List, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChapterListItem, ChapterResponse, Novel } from "../lib/types";
import { recordHistory } from "./library-actions";
import { AdSlot, InlineAdContent } from "./ads/ads-runtime";
import { ReaderAccount } from "./reader-account";
import { SiteBrand } from "./site-settings";

type ReaderData = ChapterResponse["data"];
export function ReaderExperience({ chapter, chapterList, novelInfo }: { chapter: ReaderData; chapterList: ChapterListItem[]; novelInfo: Pick<Novel, "slug" | "title" | "coverUrl" | "authorName" | "chapterCount"> }) {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("novelark-reader-theme") === "dark";
    const savedSize = localStorage.getItem("novelark-reader-font") as typeof fontSize | null;
    setDark(savedTheme); if (savedSize) setFontSize(savedSize);
    const progress = Math.min(100, Math.max(0, chapter.number / Math.max(1, novelInfo.chapterCount) * 100));
    recordHistory({ ...novelInfo, progress, savedAt: new Date().toISOString() });
  }, [chapter.number, novelInfo]);
  const toggleTheme = () => { const next = !dark; setDark(next); localStorage.setItem("novelark-reader-theme", next ? "dark" : "light"); };
  const changeSize = (size: typeof fontSize) => { setFontSize(size); localStorage.setItem("novelark-reader-font", size); };
  return (
    <div className={`readerPage${dark ? " darkReader" : ""}`}>
      <header className="readerHeader"><div className="readerContainer readerHeaderInner">
        <div><a className="readerIconButton" href={`/novels/${chapter.novel.slug}`} title="Back to novel"><ArrowLeft size={20} /></a><button className="readerIconButton" onClick={() => setOpen(true)} title="Chapter list"><List size={20} /></button></div>
        <SiteBrand className="readerBrand"/>
        <div><ReaderAccount compact/><button className="readerIconButton" onClick={toggleTheme} title={dark ? "Use light theme" : "Use dark theme"}>{dark ? <Sun size={20} /> : <Moon size={20} />}</button></div>
      </div></header>
      <main className="readerContainer readerMain">
        <p className="readerNovelTitle">{chapter.novel.title}</p><h1>{chapter.title}</h1>
        <AdSlot location="BELOW_CHAPTER_TITLE" />
        {chapter.contentAvailable ? <InlineAdContent className={`readerContent font-${fontSize}`} html={chapter.content} /> : <div className="readerUnavailable"><BookOpen size={32} /><h2>Chapter content is being imported</h2><p>The chapter is listed in the catalog, but its reading text is not available locally yet.</p></div>}
        <div className="fontControls" role="group" aria-label="Reading font size">
          {(["small", "medium", "large"] as const).map((size) => <button className={fontSize === size ? "active" : ""} onClick={() => changeSize(size)} key={size}>{size === "small" ? "A-" : size === "large" ? "A+" : "A"}</button>)}
        </div>
      </main>
      <footer className="readerFooter"><div className="readerContainer readerFooterInner">
        {chapter.previous ? <a className="readerNavButton" href={`/novels/${chapter.novel.slug}/${chapter.previous.slug}`}><ChevronLeft size={18} /> Previous</a> : <span />}
        {chapter.next ? <a className="readerNavButton" href={`/novels/${chapter.novel.slug}/${chapter.next.slug}`}>Next <ChevronRight size={18} /></a> : null}
      </div></footer>
      <button aria-label="Close chapter list" className={`readerOverlay${open ? " open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`readerSidebar${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="readerSidebarHeader"><h2>Chapters</h2><button className="readerIconButton" onClick={() => setOpen(false)} title="Close"><X size={20} /></button></div>
        <nav>{chapterList.map((item) => <a className={item.slug === chapter.slug ? "active" : ""} href={`/novels/${chapter.novel.slug}/${item.slug}`} key={item.slug}>{item.title}</a>)}</nav>
      </aside>
    </div>
  );
}
