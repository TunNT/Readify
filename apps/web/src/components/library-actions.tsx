"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { Novel } from "../lib/types";
import { readerApi, ReaderApiError } from "./reader-api";

export type StoredNovel = Pick<Novel, "slug" | "title" | "coverUrl" | "authorName" | "chapterCount"> & { savedAt: string };
export const libraryKey = "novelark-library";
export const historyKey = "novelark-history";

function readStored(key: string): StoredNovel[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as StoredNovel[]; } catch { return []; }
}

type Collections = { data: { library: StoredNovel[]; history: StoredNovel[] } | null };
export const libraryChangedEvent = "novelark-collections-changed";

function applyCollections(collections: NonNullable<Collections["data"]>) {
  localStorage.setItem(libraryKey, JSON.stringify(collections.library));
  localStorage.setItem(historyKey, JSON.stringify(collections.history));
  window.dispatchEvent(new Event(libraryChangedEvent));
}

async function authenticatedMutation(path: string, options: RequestInit) {
  try {
    const result = await readerApi<Collections>(path, options);
    if (result.data) applyCollections(result.data);
  } catch (error) {
    if (!(error instanceof ReaderApiError) || error.status !== 401) console.error(error);
  }
}

export async function syncReaderCollections() {
  const body = {
    library: readStored(libraryKey).map(({ slug, savedAt }) => ({ slug, savedAt })),
    history: readStored(historyKey).map(({ slug, savedAt }) => ({ slug, savedAt }))
  };
  const result = await readerApi<Collections>("/sync", { method: "POST", body: JSON.stringify(body) });
  if (result.data) applyCollections(result.data);
}

export function SaveToLibrary({ novel }: { novel: Novel }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(readStored(libraryKey).some((item) => item.slug === novel.slug)), [novel.slug]);
  const toggle = () => {
    const current = readStored(libraryKey);
    const next = saved ? current.filter((item) => item.slug !== novel.slug) : [{ slug: novel.slug, title: novel.title, coverUrl: novel.coverUrl, authorName: novel.authorName, chapterCount: novel.chapterCount, savedAt: new Date().toISOString() }, ...current];
    localStorage.setItem(libraryKey, JSON.stringify(next));
    setSaved(!saved);
    window.dispatchEvent(new Event(libraryChangedEvent));
    void authenticatedMutation(`/library/${encodeURIComponent(novel.slug)}`, { method: saved ? "DELETE" : "POST" });
  };
  return <button type="button" className="secondaryButton" onClick={toggle}>{saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}{saved ? "Saved" : "Library"}</button>;
}

export function TrackNovelVisit({ novel }: { novel: Novel }) {
  useEffect(() => {
    recordHistory({
      slug: novel.slug,
      title: novel.title,
      coverUrl: novel.coverUrl,
      authorName: novel.authorName,
      chapterCount: novel.chapterCount,
      savedAt: new Date().toISOString()
    });
  }, [novel.authorName, novel.chapterCount, novel.coverUrl, novel.slug, novel.title]);
  return null;
}

export function recordHistory(novel: StoredNovel) {
  const current = readStored(historyKey).filter((item) => item.slug !== novel.slug);
  localStorage.setItem(historyKey, JSON.stringify([novel, ...current].slice(0, 20)));
  window.dispatchEvent(new Event(libraryChangedEvent));
  void readerApi(`/history/${encodeURIComponent(novel.slug)}`, { method: "POST" }).catch((error: ReaderApiError) => { if (error.status !== 401) console.error(error); });
}

export function getStoredNovels(key: string) { return readStored(key); }
export function clearStoredNovels(key: typeof libraryKey | typeof historyKey) {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event(libraryChangedEvent));
  void authenticatedMutation(`/collections/${key === libraryKey ? "library" : "history"}`, { method: "DELETE" });
}
