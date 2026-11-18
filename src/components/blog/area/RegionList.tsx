import Link from "next/link";
import type { RegionEntry } from "@/lib/areas";

type RegionListProps = {
  countrySlug: string;
  regions: RegionEntry[];
  compact?: boolean;
};

/**
 * 国ページの地域一覧。地図のピンと同じ番号を振る。
 * 記事がまだない地域は「準備中」として薄く出し、リンクにしない。
 */
const RegionList: React.FC<RegionListProps> = ({ countrySlug, regions, compact = false }) => (
  <ol className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
    {regions.map(({ region, posts }, index) => {
      const hasPosts = posts.length > 0;
      const body = (
        <>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-[2.5px] border-shu text-[13px] font-bold text-shu">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block font-mincho font-extrabold text-ink ${compact ? "text-[17px]" : "text-lg"}`}>
              {region.name}
            </span>
            <span className="block text-[13px] leading-snug text-ink-muted">{region.summary}</span>
          </span>
          <span
            className={`flex-shrink-0 text-[13px] ${hasPosts ? "font-bold text-shu" : "text-ink-muted"}`}
          >
            {hasPosts ? `${posts.length}記事 →` : "準備中"}
          </span>
        </>
      );
      const className = `flex items-center gap-3.5 rounded border border-rule bg-paper-card ${
        compact ? "px-3.5 py-2.5" : "px-4 py-3.5"
      }`;
      return (
        <li key={region.slug}>
          {hasPosts ? (
            <Link
              href={`/blog/area/${countrySlug}/${region.slug}`}
              className={`${className} transition-colors hover:border-shu`}
            >
              {body}
            </Link>
          ) : (
            <div className={`${className} opacity-60`}>{body}</div>
          )}
        </li>
      );
    })}
  </ol>
);

export default RegionList;
