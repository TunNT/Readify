import { BookOpen } from "lucide-react";
import Link from "next/link";
import { formatDate, proxiedCoverUrl } from "../lib/api";
import type { Novel } from "../lib/types";

export function NovelCard({ novel }: { novel: Novel }) {
  return (
    <article className="novelCard">
      <Link className="coverLink" href={`/novels/${novel.slug}`} aria-label={`Read ${novel.title}`}>
        <img className="novelCover" src={proxiedCoverUrl(novel.coverUrl)} alt={`Cover of ${novel.title}`} />
      </Link>
      <div className="cardBody">
        <h3><Link href={`/novels/${novel.slug}`}>{novel.title}</Link></h3>
        <p className="cardDescription">{novel.description || "Discover this story and start reading for free."}</p>
        <div className="tagRow">
          {novel.categories.slice(0, 3).map((category) => <Link href={`/category/${category.slug}`} key={category.slug}>{category.name}</Link>)}
        </div>
        <div className="cardFooter">
          <Link className="readButton" href={`/novels/${novel.slug}`}><BookOpen size={14} /> Read Now</Link>
          <time>{formatDate(novel.updatedAt)}</time>
        </div>
      </div>
    </article>
  );
}
