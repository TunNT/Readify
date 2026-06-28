import { LibraryView } from "../../components/library-view";
import { SiteChrome } from "../../components/site-chrome";

export const metadata:Metadata={title:"My Library",robots:{index:false,follow:false}};

export default function LibraryPage() { return <SiteChrome><LibraryView /></SiteChrome>; }
import type { Metadata } from "next";
