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

export function InlineAdContent({ html, className }: { html: string; className: string }) {
  const allAds = useContext(AdsContext);
  const inlineAds = useMemo(() => allAds.filter((ad) => ad.location === "INLINE" && ad.wordInterval), [allAds]);
  const [segments, setSegments] = useState<ContentSegment[]>([{ html, ads: [] }]);
  useEffect(() => {
    if (!inlineAds.length) { setSegments([{ html, ads: [] }]); return; }
    const documentNode = new DOMParser().parseFromString(html, "text/html");
    const nodes = [...documentNode.body.childNodes];
    const counters = inlineAds.map((ad) => ({ ad, next: ad.wordInterval!, count: 0 }));
    const nextSegments: ContentSegment[] = [];
    let buffer = "";
    for (const node of nodes) {
      const holder = document.createElement("div"); holder.appendChild(node.cloneNode(true)); buffer += holder.innerHTML;
      const words = (node.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
      const due: AdPlacement[] = [];
      for (const counter of counters) {
        counter.count += words;
        const currentInsertions = nextSegments.reduce((total, segment) => total + segment.ads.filter((item) => item.id === counter.ad.id).length, 0);
        if (counter.count >= counter.next && (!counter.ad.maxInsertions || currentInsertions < counter.ad.maxInsertions)) {
          due.push(counter.ad); counter.next += counter.ad.wordInterval!;
        }
      }
      if (due.length) { nextSegments.push({ html: buffer, ads: due }); buffer = ""; }
    }
    if (buffer) nextSegments.push({ html: buffer, ads: [] });
    setSegments(nextSegments.length ? nextSegments : [{ html, ads: [] }]);
  }, [html, inlineAds]);
  return <div className={className}>{segments.map((segment, index) => <div className={styles.contentSegment} key={`${index}-${segment.html.length}`}><div dangerouslySetInnerHTML={{ __html: segment.html }} />{segment.ads.map((ad) => <AdCode ad={ad} key={`${ad.id}-${index}`} />)}</div>)}</div>;
}
