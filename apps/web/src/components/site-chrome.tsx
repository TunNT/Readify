import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}
