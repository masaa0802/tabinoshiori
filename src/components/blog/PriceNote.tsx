import Image from "next/image";
import type { PriceFigure } from "@/lib/microcms/types";
import { isPriceStale, optimizedImageUrl } from "@/lib/microcms/format";

/**
 * 本文中に金額・相場を出すためのブロック。
 *
 * 編集方針: 金額を書くときは出典と調査時点を必ず併記する。
 * `PriceFigure` の `source` / `surveyedAt` は必須のため、
 * 注釈を落としたまま金額だけ書くことは型レベルでできない。
 */
type PriceNoteProps = {
  figure: PriceFigure;
};

const PriceNote: React.FC<PriceNoteProps> = ({ figure }) => {
  const stale = isPriceStale(figure.surveyedAt);

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-rule bg-paper-card">
      <div className="border-b border-rule bg-paper-deep px-5 py-4">
        <p className="text-xs font-semibold text-ink-muted">{figure.label}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{figure.value}</p>
        {figure.note && (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            {figure.note}
          </p>
        )}
      </div>

      {figure.image && (
        <div className="border-b border-rule">
          <div className="relative aspect-[16/9] bg-paper-deep">
            <Image
              src={optimizedImageUrl(figure.image.url, 800)}
              alt={figure.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-contain"
            />
          </div>
          {figure.image.caption && (
            <p className="px-5 py-2 text-[11px] text-ink-muted">
              {figure.image.caption}
            </p>
          )}
        </div>
      )}

      <figcaption className="px-5 py-3 text-[11px] leading-relaxed text-ink-muted">
        <span className="font-semibold">出典:</span>{" "}
        {figure.sourceUrl ? (
          <a
            href={figure.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-shu underline underline-offset-2 hover:text-shu-dark"
          >
            {figure.source}
          </a>
        ) : (
          figure.source
        )}
        <span className="mx-1.5" aria-hidden="true">
          /
        </span>
        <span className="font-semibold">調査時点:</span> {figure.surveyedAt}
        {stale && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
            要更新
          </span>
        )}
      </figcaption>
    </figure>
  );
};

export default PriceNote;
