import type { Metadata } from "next";
import "./globals.css";
import { AdsRuntime } from "../components/ads/ads-runtime";

export const metadata: Metadata = {
  title: { default: "WeAreNovelArk", template: "%s | WeAreNovelArk" },
  description: "Read free romance, fantasy, werewolf, and contemporary novels."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AdsRuntime>{children}</AdsRuntime></body>
    </html>
  );
}
