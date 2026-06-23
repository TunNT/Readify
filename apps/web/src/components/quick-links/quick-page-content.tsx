"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./quick-links.module.css";

type ContactSubmission = Record<string, FormDataEntryValue> & { submittedAt: string };

export function QuickPageContent({ html, page }: { html: string; page: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    element.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
      try {
        const url = new URL(anchor.href);
        if (url.hostname === "goodluckark.com" || url.hostname === "www.wearenovelark.com") anchor.href = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        // Relative and mail links already work as authored.
      }
    });

    const cleanups: Array<() => void> = [];
    if (page === "faq") {
      element.querySelectorAll<HTMLElement>(".faq-question").forEach((question) => {
        question.removeAttribute("onclick");
        question.tabIndex = 0;
        question.setAttribute("role", "button");
        question.setAttribute("aria-expanded", "false");
        const toggle = () => {
          const answer = question.nextElementSibling as HTMLElement | null;
          const expanded = !question.classList.contains("active");
          question.classList.toggle("active", expanded);
          answer?.classList.toggle("show", expanded);
          question.setAttribute("aria-expanded", String(expanded));
        };
        const click = () => toggle();
        const keydown = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } };
        question.addEventListener("click", click);
        question.addEventListener("keydown", keydown);
        cleanups.push(() => { question.removeEventListener("click", click); question.removeEventListener("keydown", keydown); });
      });
    }

    if (page === "contact") {
      const form = element.querySelector<HTMLFormElement>("form");
      if (form) {
        form.removeAttribute("onsubmit");
        const submit = (event: SubmitEvent) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(form).entries()) as Record<string, FormDataEntryValue>;
          let submissions: ContactSubmission[] = [];
          try { submissions = JSON.parse(localStorage.getItem("contactSubmissions") ?? "[]") as ContactSubmission[]; } catch { submissions = []; }
          localStorage.setItem("contactSubmissions", JSON.stringify([...submissions, { ...values, submittedAt: new Date().toISOString() }]));
          form.reset();
          setMessage("Thank you. Your message has been saved successfully.");
        };
        form.addEventListener("submit", submit);
        cleanups.push(() => form.removeEventListener("submit", submit));
      }
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [page]);

  return <><div ref={root} className={`${styles.content} ${styles[page] ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />{message ? <div className={styles.successMessage} role="status">{message}</div> : null}</>;
}
