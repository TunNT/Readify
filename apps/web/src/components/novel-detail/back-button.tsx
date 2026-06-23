"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./detail.module.css";

export function BackButton() {
  const router = useRouter();
  return <button type="button" className={styles.navButton} onClick={() => router.back()}><ArrowLeft size={15} /> Back</button>;
}
