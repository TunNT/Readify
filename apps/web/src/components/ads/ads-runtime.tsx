"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IsolatedAdFrame, usesIsolatedFrame } from "./isolated-ad-frame";
import styles from "./ads.module.css";

export type AdPlacement = {
  id: string; name: string; key: string; scope: "GLOBAL" | "PAGE_TYPE" | "SPECIFIC_PAGE";
  scopeValue?: string | null; location: "HEAD" | "OPEN_BODY" | "CLOSE_BODY" | "TOP" | "BOTTOM" | "BELOW_CHAPTER_TITLE" | "INLINE";
  codeType: "HTML" | "INLINE_JS" | "EXTERNAL_SCRIPT"; code: string; device: "ALL" | "DESKTOP" | "MOBILE";
  wordInterval?: number | null; maxInsertions?: number | null; priority: number;
};

type AdsContextValue = {
  ads: AdPlacement[];
  headReady: boolean;
  markPlacementReady: (id: string) => void;
};

const AdsContext = createContext<AdsContextValue>({ ads: [], headReady: false, markPlacementReady: () => undefined });
const globalHeadPlacements = new Map<string, Promise<void>>();
const globalExternalScripts = new Map<string, Promise<void>>();
const scriptLoadTimeoutMs = 30_000;

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

type ScriptDefinition = {
  attributes: Array<{ name: string; value: string }>;
  source: string;
  text: string;
};

type PendingScript = {
  definition: ScriptDefinition;
  placeholder?: Comment;
};

function scriptDefinition(script: HTMLScriptElement): ScriptDefinition {
  return {
    attributes: [...script.attributes].map(({ name, value }) => ({ name, value })),
    source: script.getAttribute("src")?.trim() ?? "",
    text: script.textContent ?? "",
  };
}

function copyScriptAttributes(script: HTMLScriptElement, definition: ScriptDefinition) {
  definition.attributes.forEach(({ name, value }) => {
    if (name.toLowerCase() !== "src") script.setAttribute(name, value);
  });
}

function hasScriptAttribute(definition: ScriptDefinition, name: string) {
  return definition.attributes.some((attribute) => attribute.name.toLowerCase() === name);
}

function insertScript(script: HTMLScriptElement, pending: PendingScript, fallbackHost: HTMLElement) {
  const placeholder = pending.placeholder;
  if (placeholder?.parentNode) {
    placeholder.parentNode.insertBefore(script, placeholder);
    placeholder.remove();
    return;
  }
  fallbackHost.appendChild(script);
}

function appendScript(pending: PendingScript, fallbackHost: HTMLElement) {
  const { definition } = pending;
  if (!definition.source) {
    const isModule = definition.attributes.some(({ name, value }) => name.toLowerCase() === "type" && value.toLowerCase() === "module");
    if (isModule) {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        const timeout = window.setTimeout(() => reject(new Error("Inline module ad script timed out")), scriptLoadTimeoutMs);
        copyScriptAttributes(script, definition);
        script.text = definition.text;
        script.addEventListener("load", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
        script.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error("Unable to execute inline module ad script")); }, { once: true });
        insertScript(script, pending, fallbackHost);
      });
    }
    const script = document.createElement("script");
    copyScriptAttributes(script, definition);
    script.text = definition.text;
    insertScript(script, pending, fallbackHost);
    return Promise.resolve();
  }

  const source = new URL(definition.source, document.baseURI).href;
  const existingLoad = globalExternalScripts.get(source);
  if (existingLoad) {
    pending.placeholder?.remove();
    return existingLoad;
  }

  const load = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => reject(new Error(`Ad script timed out: ${source}`)), scriptLoadTimeoutMs);
    copyScriptAttributes(script, definition);
    if (!hasScriptAttribute(definition, "async")) script.async = false;
    script.src = source;
    script.addEventListener("load", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
    script.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error(`Unable to load ad script: ${source}`)); }, { once: true });
    insertScript(script, pending, fallbackHost);
  });
  globalExternalScripts.set(source, load);
  void load.catch(() => {
    if (globalExternalScripts.get(source) === load) globalExternalScripts.delete(source);
  });
  return load;
}

async function executeScripts(host: HTMLElement, scripts: PendingScript[]) {
  for (const pending of scripts) {
    const load = appendScript(pending, host);
    const runsAsync = Boolean(pending.definition.source) && hasScriptAttribute(pending.definition, "async");
    if (runsAsync) {
      void load.catch((error) => console.error(`[ads] ${error instanceof Error ? error.message : "Async script failed"}`));
    } else {
      await load;
    }
  }
}

function appendHtmlMarkup(host: HTMLElement, code: string) {
  const template = document.createElement("template");
  template.innerHTML = code;
  const scripts = [...template.content.querySelectorAll("script")].map((script) => {
    const placeholder = document.createComment("ad-script");
    const definition = scriptDefinition(script);
    script.replaceWith(placeholder);
    return { definition, placeholder };
  });
  host.appendChild(template.content);
  return scripts;
}

async function appendAdCode(host: HTMLElement, ad: AdPlacement) {
  if (ad.codeType === "HTML") {
    await executeScripts(host, appendHtmlMarkup(host, ad.code));
    return;
  }
  await executeScripts(host, [{
    definition: {
      attributes: [],
      source: ad.codeType === "EXTERNAL_SCRIPT" ? ad.code.trim() : "",
      text: ad.codeType === "INLINE_JS" ? ad.code : "",
    },
  }]);
}

function loadHeadPlacement(ad: AdPlacement) {
  const cacheKey = `${ad.id}:${ad.codeType}:${ad.code}`;
  const existingLoad = globalHeadPlacements.get(cacheKey);
  if (existingLoad) return existingLoad;

  const load = appendAdCode(document.head, ad);
  globalHeadPlacements.set(cacheKey, load);
  load.catch(() => {
    globalHeadPlacements.delete(cacheKey);
  });
  return load;
}

function deviceClass(ad: AdPlacement) {
  return ad.device === "ALL" ? "" : styles[ad.device.toLowerCase()];
}

function InjectedAdCode({ ad, renderKey }: { ad: AdPlacement; renderKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scriptsRef = useRef<PendingScript[]>([]);
  const { headReady, markPlacementReady } = useContext(AdsContext);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.replaceChildren();
    scriptsRef.current = ad.codeType === "HTML"
      ? appendHtmlMarkup(host, ad.code)
      : [{
          definition: {
            attributes: [],
            source: ad.codeType === "EXTERNAL_SCRIPT" ? ad.code.trim() : "",
            text: ad.codeType === "INLINE_JS" ? ad.code : "",
          },
        }];
    markPlacementReady(ad.id);
    return () => {
      scriptsRef.current = [];
      host.replaceChildren();
    };
  }, [ad, markPlacementReady, renderKey]);
  useEffect(() => {
    const host = ref.current;
    if (!host || !headReady) return;
    let active = true;
    (async () => {
      try {
        await executeScripts(host, scriptsRef.current);
      } catch (error) {
        if (active) console.error(`[ads] ${ad.key}: ${error instanceof Error ? error.message : "Placement script failed"}`);
      }
    })();
    return () => { active = false; };
  }, [ad, headReady, renderKey]);
  return <div ref={ref} className={`${styles.slot} ${deviceClass(ad)}`} data-ad-key={ad.key} aria-label="Advertisement" />;
}

function AdCode({ ad, renderKey }: { ad: AdPlacement; renderKey: string }) {
  const isolated = usesIsolatedFrame(ad);
  const { markPlacementReady } = useContext(AdsContext);
  useEffect(() => {
    if (isolated) markPlacementReady(ad.id);
  }, [ad.id, isolated, markPlacementReady]);
  return isolated ? <IsolatedAdFrame ad={ad} /> : <InjectedAdCode ad={ad} renderKey={renderKey} />;
}

export function AdSlot({ location }: { location: AdPlacement["location"] }) {
  const path = usePathname();
  const allAds = useContext(AdsContext).ads;
  const ads = allAds.filter((ad) => ad.location === location);
  if (!ads.length) return null;
  return <div className={styles.region} data-ad-location={location.toLowerCase()}>{ads.map((ad) => <AdCode ad={ad} renderKey={`${path}:${location}:${ad.id}`} key={`${path}:${ad.id}`} />)}</div>;
}

export function AdsRuntime({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [headReady, setHeadReady] = useState(false);
  const [readyPlacementIds, setReadyPlacementIds] = useState<Set<string>>(() => new Set());
  const markPlacementReady = useCallback((id: string) => {
    setReadyPlacementIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);
  useEffect(() => {
    if (path.startsWith("/admin")) { setAds([]); setHeadReady(false); setReadyPlacementIds(new Set()); return; }
    setAds([]);
    setHeadReady(false);
    setReadyPlacementIds(new Set());
    const controller = new AbortController();
    fetch(`/api/ads?path=${encodeURIComponent(path)}&pageType=${encodeURIComponent(pageType(path))}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Ads request failed")))
      .then((body: { data: AdPlacement[] }) => setAds(body.data))
      .catch((error: Error) => { if (error.name !== "AbortError") setAds([]); });
    return () => controller.abort();
  }, [path]);
  useEffect(() => {
    if (!ads.length) return;
    let active = true;
    const headAds = ads.filter((ad) => ad.location === "HEAD");
    const immediateLocations = new Set<AdPlacement["location"]>(["OPEN_BODY", "TOP", "BOTTOM", "CLOSE_BODY"]);
    if (pageType(path) === "CHAPTER_READER") immediateLocations.add("BELOW_CHAPTER_TITLE");
    const requiredPlacements = ads.filter((ad) => immediateLocations.has(ad.location));
    if (headAds.length && requiredPlacements.some((ad) => !readyPlacementIds.has(ad.id))) return;
    (async () => {
      for (const ad of headAds) {
        try {
          await loadHeadPlacement(ad);
        } catch (error) {
          console.error(`[ads] ${ad.key}: ${error instanceof Error ? error.message : "Head script failed"}`);
        }
      }
      if (active) setHeadReady(true);
    })();
    return () => { active = false; };
  }, [ads, path, readyPlacementIds]);
  const value = useMemo(() => ({ ads, headReady, markPlacementReady }), [ads, headReady, markPlacementReady]);
  return <AdsContext.Provider value={value}><AdSlot location="OPEN_BODY" /><AdSlot location="TOP" />{children}<AdSlot location="BOTTOM" /><AdSlot location="CLOSE_BODY" /></AdsContext.Provider>;
}

type ContentSegment = { html: string; ads: AdPlacement[] };

function adPriorityRank(ad: AdPlacement) {
  return ad.priority > 0 ? ad.priority : Number.MAX_SAFE_INTEGER;
}

export function InlineAdContent({ html, className }: { html: string; className: string }) {
  const path = usePathname();
  const allAds = useContext(AdsContext).ads;
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
        if (currentInsertions > 0) continue;
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
  return <div className={className}>{segments.map((segment, index) => <div className={styles.contentSegment} key={`${path}-${index}-${segment.html.length}`}><div dangerouslySetInnerHTML={{ __html: segment.html }} />{segment.ads.map((ad, adIndex) => <AdCode ad={ad} renderKey={`${path}:inline:${index}:${ad.id}:${adIndex}`} key={`${path}:${ad.id}:${index}:${adIndex}`} />)}</div>)}</div>;
}
