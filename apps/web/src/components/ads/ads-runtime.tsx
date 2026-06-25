"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./ads.module.css";

export type AdPlacement = {
  id: string; name: string; key: string; scope: "GLOBAL" | "PAGE_TYPE" | "SPECIFIC_PAGE";
  scopeValue?: string | null; location: "HEAD" | "OPEN_BODY" | "CLOSE_BODY" | "TOP" | "BOTTOM" | "INLINE";
  codeType: "HTML" | "INLINE_JS" | "EXTERNAL_SCRIPT"; code: string; device: "ALL" | "DESKTOP" | "MOBILE";
  wordInterval?: number | null; maxInsertions?: number | null; priority: number;
};

const AdsContext = createContext<AdPlacement[]>([]);

function pageType(path: string) {
  if (path === "/") return "HOME";
  if (path.startsWith("/category/") || path === "/categories") return "CATEGORY";
  if (/^\/novels\/[^/]+\/[^/]+/.test(path)) return "CHAPTER_READER";
  if (/^\/novels\/[^/]+/.test(path)) return "NOVEL_DETAIL";
  if (path === "/novels") return "NOVEL_LIST";
  if (path.startsWith("/search")) return "SEARCH";
  if (path.startsWith("/admin")) return "ADMIN";
  return "CONTENT_PAGE";
}

function activateScripts(container: HTMLElement) {
  container.querySelectorAll("script").forEach((oldScript) => {
    const script = document.createElement("script");
    [...oldScript.attributes].forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
    script.text = oldScript.text;
    oldScript.replaceWith(script);
  });
}

function AdCode({ ad, target = "body" }: { ad: AdPlacement; target?: "body" | "head" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = target === "head" ? document.head : ref.current;
    if (!host) return;
    const marker = document.createElement(target === "head" ? "meta" : "div");
    marker.dataset.adPlacement = ad.key;
    if (ad.codeType === "EXTERNAL_SCRIPT") {
      const script = document.createElement("script"); script.async = true; script.src = ad.code.trim(); marker.appendChild(script);
    } else if (ad.codeType === "INLINE_JS") {
      const script = document.createElement("script"); script.text = ad.code; marker.appendChild(script);
    } else {
      marker.innerHTML = ad.code; activateScripts(marker);
    }
    host.appendChild(marker);
    return () => marker.remove();
  }, [ad, target]);
  if (target === "head") return null;
  return <div ref={ref} className={`${styles.slot} ${styles[ad.device.toLowerCase()]}`} data-ad-key={ad.key} aria-label="Advertisement" />;
}

export function AdSlot({ location }: { location: AdPlacement["location"] }) {
  const ads = useContext(AdsContext).filter((ad) => ad.location === location);
  if (!ads.length) return null;
  return <div className={styles.region} data-ad-location={location.toLowerCase()}>{ads.map((ad) => <AdCode ad={ad} key={ad.id} />)}</div>;
}

function HeadAds() {
  const ads = useContext(AdsContext).filter((ad) => ad.location === "HEAD");
  return <>{ads.map((ad) => <AdCode ad={ad} key={ad.id} target="head" />)}</>;
}

export function AdsRuntime({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [ads, setAds] = useState<AdPlacement[]>([]);
  useEffect(() => {
    if (path.startsWith("/admin")) { setAds([]); return; }
    const controller = new AbortController();
    fetch(`/api/ads?path=${encodeURIComponent(path)}&pageType=${encodeURIComponent(pageType(path))}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Ads request failed")))
      .then((body: { data: AdPlacement[] }) => setAds(body.data))
      .catch((error: Error) => { if (error.name !== "AbortError") setAds([]); });
    return () => controller.abort();
  }, [path]);
  const value = useMemo(() => ads, [ads]);
  return <AdsContext.Provider value={value}><HeadAds /><AdSlot location="OPEN_BODY" /><AdSlot location="TOP" />{children}<AdSlot location="BOTTOM" /><AdSlot location="CLOSE_BODY" /></AdsContext.Provider>;
}

type ContentSegment = { html: string; ads: AdPlacement[] };

function adPriorityRank(ad: AdPlacement) {
  return ad.priority > 0 ? ad.priority : Number.MAX_SAFE_INTEGER;
}

export function InlineAdContent({ html, className }: { html: string; className: string }) {
  const allAds = useContext(AdsContext);
  const inlineAds = useMemo(() => [...allAds]
    .filter((ad) => ad.location === "INLINE" && ad.wordInterval)
    .sort((left, right) => adPriorityRank(left) - adPriorityRank(right)), [allAds]);
  const [segments, setSegments] = useState<ContentSegment[]>([{ html, ads: [] }]);
  useEffect(() => {
    if (!inlineAds.length) { setSegments([{ html, ads: [] }]); return; }
    const documentNode = new DOMParser().parseFromString(html, "text/html");
    const insertionCounts = new Map<string, number>();
    let wordsSinceInsertion = 0;
    let adCursor = 0;
    const markers: AdPlacement[] = [];
    const pickNextAd = () => {
      for (let offset = 0; offset < inlineAds.length; offset += 1) {
        const index = (adCursor + offset) % inlineAds.length;
        const ad = inlineAds[index];
        const currentInsertions = insertionCounts.get(ad.id) ?? 0;
        if (ad.maxInsertions && currentInsertions >= ad.maxInsertions) continue;
        return { ad, index };
      }
      return null;
    };
    const insertMarker = (textNode: Text, splitOffset: number, candidate: { ad: AdPlacement; index: number }) => {
      const marker = documentNode.createElement("span");
      marker.setAttribute("data-inline-ad-marker", String(markers.length));
      markers.push(candidate.ad);
      const remainder = textNode.splitText(splitOffset);
      textNode.parentNode?.insertBefore(marker, remainder);
      insertionCounts.set(candidate.ad.id, (insertionCounts.get(candidate.ad.id) ?? 0) + 1);
      adCursor = (candidate.index + 1) % inlineAds.length;
      wordsSinceInsertion = 0;
      return remainder;
    };
    const processTextNode = (initialNode: Text) => {
      let textNode = initialNode;
      while (textNode.nodeValue) {
        const candidate = pickNextAd();
        if (!candidate) return;
        const wordsNeeded = candidate.ad.wordInterval! - wordsSinceInsertion;
        const matches = [...textNode.nodeValue.matchAll(/\S+/g)];
        if (matches.length < wordsNeeded) {
          wordsSinceInsertion += matches.length;
          return;
        }
        const word = matches[wordsNeeded - 1];
        textNode = insertMarker(textNode, (word.index ?? 0) + word[0].length, candidate);
      }
    };
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) { processTextNode(node as Text); return; }
      if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
      const element = node as Element;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(element.tagName)) return;
      [...node.childNodes].forEach(walk);
    };
    walk(documentNode.body);
    const nextSegments: ContentSegment[] = [];
    const markerPattern = /<span data-inline-ad-marker="(\d+)"><\/span>/g;
    const markedHtml = documentNode.body.innerHTML;
    let lastIndex = 0;
    for (let match = markerPattern.exec(markedHtml); match; match = markerPattern.exec(markedHtml)) {
      nextSegments.push({ html: markedHtml.slice(lastIndex, match.index), ads: [markers[Number(match[1])]].filter(Boolean) });
      lastIndex = markerPattern.lastIndex;
    }
    const tail = markedHtml.slice(lastIndex);
    if (tail) nextSegments.push({ html: tail, ads: [] });
    setSegments(nextSegments.length ? nextSegments : [{ html, ads: [] }]);
  }, [html, inlineAds]);
  return <div className={className}>{segments.map((segment, index) => <div className={styles.contentSegment} key={`${index}-${segment.html.length}`}><div dangerouslySetInnerHTML={{ __html: segment.html }} />{segment.ads.map((ad, adIndex) => <AdCode ad={ad} key={`${ad.id}-${index}-${adIndex}`} />)}</div>)}</div>;
}
