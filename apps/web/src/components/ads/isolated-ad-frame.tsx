"use client";

import { useId, useMemo } from "react";
import type { AdPlacement } from "./ads-runtime";
import styles from "./ads.module.css";

function iframeDocument(code: string, instanceId: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>html,body{margin:0;min-height:100%;}*,*::before,*::after{box-sizing:border-box;}</style>
</head>
<body data-ad-instance="${instanceId}">${code}</body>
</html>`;
}

export function usesIsolatedFrame(ad: AdPlacement) {
  return ad.codeType === "HTML" && /data-ad-runtime\s*=\s*["']iframe["']/i.test(ad.code);
}

export function IsolatedAdFrame({ ad }: { ad: AdPlacement }) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const instanceId = `ad-frame-${ad.id}-${reactId}`;
  const srcDoc = useMemo(() => iframeDocument(ad.code, instanceId), [ad.code, instanceId]);
  return <iframe
    className={`${styles.isolatedFrame} ${ad.device === "ALL" ? "" : styles[ad.device.toLowerCase()]}`}
    srcDoc={srcDoc}
    sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
    allow="autoplay; fullscreen; picture-in-picture"
    referrerPolicy="strict-origin-when-cross-origin"
    title={`${ad.name} advertisement`}
  />;
}

