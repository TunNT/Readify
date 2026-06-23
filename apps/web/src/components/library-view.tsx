"use client";

import { BookOpen, Bookmark, Clock3, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { proxiedCoverUrl } from "../lib/api";
import { clearStoredNovels, getStoredNovels, historyKey, libraryChangedEvent, libraryKey, type StoredNovel } from "./library-actions";

export function LibraryView() {
  const [tab, setTab] = useState<"library" | "history">("library");
  const [library, setLibrary] = useState<StoredNovel[]>([]);
  const [history, setHistory] = useState<StoredNovel[]>([]);
  useEffect(() => { const load = () => { setLibrary(getStoredNovels(libraryKey)); setHistory(getStoredNovels(historyKey)); }; load(); window.addEventListener(libraryChangedEvent, load); return () => window.removeEventListener(libraryChangedEvent, load); }, []);
  const items = tab === "library" ? library : history;
  const clear = () => {
    clearStoredNovels(tab === "library" ? libraryKey : historyKey);
    if (tab === "library") setLibrary([]); else setHistory([]);
  };
  return (
    <main className="siteContainer libraryPage">
      <header className="pageHeader"><div><h1>My Library</h1><p>Sign in to sync saved stories and recent reading across devices.</p></div>{items.length ? <button className="clearButton" onClick={clear}><Trash2 size={16} /> Clear</button> : null}</header>
      <div className="segmentedControl" role="tablist"><button role="tab" aria-selected={tab === "library"} className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}><Bookmark size={16} /> Saved</button><button role="tab" aria-selected={tab === "history"} className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><Clock3 size={16} /> Recent</button></div>
      {items.length ? <div className="libraryList">{items.map((item) => <article key={item.slug}><img src={proxiedCoverUrl(item.coverUrl)} alt={`Cover of ${item.title}`} /><div><h2><Link href={`/novels/${item.slug}`}>{item.title}</Link></h2><p>{item.authorName || "Unknown Author"}</p><span>{item.chapterCount} chapters</span><Link className="readButton" href={`/novels/${item.slug}`}><BookOpen size={14} /> View Novel</Link></div></article>)}</div> : <div className="emptyState"><Bookmark size={36} /><h2>{tab === "library" ? "Your library is empty" : "No reading history yet"}</h2><p>{tab === "library" ? "Save a novel from its detail page." : "Open a chapter and it will appear here."}</p><Link className="primaryButton" href="/novels">Browse Novels</Link></div>}
    </main>
  );
}
