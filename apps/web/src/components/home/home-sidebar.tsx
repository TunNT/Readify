import { BriefcaseBusiness, Building2, ChartNoAxesColumn, CircleHelp, Crown, FileText, Flame, Grid3X3, Heart, Info, Link as LinkIcon, Mail, Moon, Shield, WandSparkles } from "lucide-react";
import Link from "next/link";
import type { HomeResponse } from "../../lib/types";
import styles from "./home.module.css";

const genres = [
  ["romance", "Romance", Heart], ["fantasy", "Fantasy", WandSparkles], ["werewolf", "Werewolf", Moon],
  ["alpha", "Alpha", Crown], ["billionaire", "Billionaire CEO", BriefcaseBusiness], ["contemporary", "Contemporary", Building2]
] as const;
const quickLinks = [
  ["/about", "About Us", Info], ["/faq", "FAQ", CircleHelp], ["/contact", "Contact", Mail],
  ["/privacy", "Privacy Policy", Shield], ["/terms", "Terms", FileText]
] as const;

export function HomeSidebar({ data }: { data: HomeResponse["data"] }) {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.widget}><h2 className={styles.widgetTitle}><Grid3X3 size={15} /> Browse Genres</h2><ul className={styles.catList}>{genres.map(([slug, label, Icon]) => <li key={slug}><Link href={`/category/${slug}`}><span className={styles.catLabel}><Icon size={14} />{label}</span></Link></li>)}</ul></section>
      <section className={styles.widget}><h2 className={styles.widgetTitle}><Flame size={15} /> Hot Rankings</h2><ol className={styles.rankList}>{data.hotRankings.map(({ position, novel }) => <li className={styles.rankItem} key={novel.id}><span className={`${styles.rankBadge} ${position === 1 ? styles.top1 : position === 2 ? styles.top2 : position === 3 ? styles.top3 : styles.normal}`}>{position}</span><div className={styles.rankInfo}><Link className={styles.rankTitle} href={`/novels/${novel.slug}`}>{novel.title}</Link><div className={styles.rankMeta}>{novel.chapterCount.toLocaleString("en-US")} chapters · {novel.categories[0]?.name ?? "Novel"}</div></div></li>)}</ol></section>
      <section className={styles.widget}><h2 className={styles.widgetTitle}><ChartNoAxesColumn size={15} /> Site Stats</h2><div className={styles.statsGrid}><div className={styles.statCard}><b>{Math.ceil(data.stats.novelCount / 10) * 10}+</b><span>Novels</span></div><div className={styles.statCard}><b>{Math.floor(data.stats.chapterCount / 1000)}K+</b><span>Chapters</span></div><div className={styles.statCard}><b>100%</b><span>Free</span></div><div className={styles.statCard}><b>6</b><span>Genres</span></div></div></section>
      <section className={styles.widget}><h2 className={styles.widgetTitle}><LinkIcon size={15} /> Quick Links</h2><ul className={styles.catList}>{quickLinks.map(([href, label, Icon]) => <li key={href}><Link href={href}><span className={styles.catLabel}><Icon size={14} />{label}</span></Link></li>)}</ul></section>
    </aside>
  );
}
