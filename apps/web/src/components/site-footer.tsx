import Link from "next/link";
import { SiteBrand, SiteName } from "./site-settings";

const footerGroups = [
  { title: "Quick Links", links: [["About Us", "#"], ["Contact", "#"], ["Privacy Policy", "#"], ["Terms of Service", "#"]] },
  { title: "Support", links: [["Help Center", "#"], ["FAQ", "#"], ["Feedback", "#"], ["Report Issue", "#"]] },
  { title: "Discover", links: [["Romance", "/category/romance"], ["Fantasy", "/category/fantasy"], ["Werewolf", "/category/werewolf"], ["Billionaire", "/category/billionaire"]] }
];

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="footerInner">
        <div className="footerAbout">
          <SiteBrand className="footerBrand"/>
          <p>A curated selection of free romance, fantasy, werewolf, and contemporary novels.</p>
        </div>
        {footerGroups.map((group) => (
          <div className="footerGroup" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          </div>
        ))}
      </div>
      <div className="copyright">© 2025 <SiteName/>. All rights reserved.</div>
    </footer>
  );
}
