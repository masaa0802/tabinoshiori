import Image from "next/image";
import type { Souvenir } from "@/lib/microcms/types";
import {
  formatDate,
  googleMapsUrl,
  isPriceStale,
  optimizedImageUrl,
  toDateAttribute,
} from "@/lib/microcms/format";
import CoverPlaceholder from "./CoverPlaceholder";

/**
 * 記事内のお土産ガイド。品をジャンルごとに分けて並べる。
 *
 * 1品ごとに読者が判断できるようにしているのは次の4点。
 * - 日本でも買えるか（品名の横のラベル）
 * - いくらか
 * - どこで買えるか（地図リンクつき）
 * - いつ時点の情報か（確認日。6か月を過ぎると「要確認」）
 *
 * 見た目はブログの他の部品（SpotCard・ArticleCard）と揃えている。
 * 色はエメラルドとグレーだけを使い、専用の配色は持たせないこと。
 *
 * ジャンルの並び順は、記事に紐づけた品の順番で最初に出てきた順。
 * 並べ替えたいときは microCMS の参照の順番を入れ替える。
 */
type SouvenirGuideProps = {
  souvenirs: Souvenir[];
};

type GenreGroup = {
  genre: string;
  anchor: string;
  items: Souvenir[];
};

function groupByGenre(souvenirs: Souvenir[]): GenreGroup[] {
  const groups: GenreGroup[] = [];
  for (const item of souvenirs) {
    let group = groups.find((g) => g.genre === item.genre);
    if (!group) {
      // ジャンル名は日本語なので、アンカーには出現順の番号を使う
      group = { genre: item.genre, anchor: `souvenir-${groups.length + 1}`, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

function latestCheckedAt(souvenirs: Souvenir[]): string | undefined {
  return souvenirs
    .map((item) => item.checkedAt)
    .filter((iso) => !Number.isNaN(new Date(iso).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

const SouvenirGuide: React.FC<SouvenirGuideProps> = ({ souvenirs }) => {
  if (souvenirs.length === 0) return null;

  const groups = groupByGenre(souvenirs);
  const localOnlyCount = souvenirs.filter((item) => !item.availableInJapan).length;
  const updatedAt = latestCheckedAt(souvenirs);

  return (
    <section aria-label="お土産ガイド" className="mt-12">
      {/* 概要とジャンルの目次 */}
      <div className="rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-700">
          <span className="font-bold text-gray-900">{souvenirs.length}品</span>を紹介
          {localOnlyCount > 0 && (
            <>
              ・うち
              <span className="font-bold text-emerald-700">現地限定 {localOnlyCount}品</span>
            </>
          )}
        </p>
        {updatedAt && (
          <p className="mt-1 text-xs text-gray-400">
            最終確認{" "}
            <time dateTime={toDateAttribute(updatedAt)}>{formatDate(updatedAt)}</time>
            （価格・販売場所は品ごとに確認日を記載）
          </p>
        )}

        {groups.length > 1 && (
          <nav aria-label="ジャンル" className="mt-4 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.anchor}
                href={`#${group.anchor}`}
                className="rounded-full border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {group.genre}
                <span className="ml-1.5 text-xs text-gray-400">{group.items.length}</span>
              </a>
            ))}
          </nav>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.anchor} id={group.anchor} className="scroll-mt-20">
          <h2 className="mb-4 mt-12 flex items-baseline gap-2 border-b border-gray-200 pb-2 text-2xl font-bold text-gray-900">
            {group.genre}
            <span className="text-sm font-normal text-gray-400">{group.items.length}品</span>
          </h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <SouvenirCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

function SouvenirCard({ item }: { item: Souvenir }) {
  const stale = isPriceStale(item.checkedAt);
  const mapUrl = googleMapsUrl(item.place, {
    placeId: item.placeId,
    address: item.address,
  });

  return (
    <article className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-28">
        {item.photo ? (
          <Image
            src={optimizedImageUrl(item.photo.url, 240)}
            alt={item.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <CoverPlaceholder
            categorySlug={item.genre}
            categoryName={item.genre}
            variant="thumb"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-bold text-gray-900">{item.name}</h3>
          {/* いちばん知りたい「日本でも買えるか」は品名のすぐ横に出す */}
          {item.availableInJapan ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              日本でも買える
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              現地限定
            </span>
          )}
        </div>

        {item.price && (
          <p className="mt-1 text-sm font-semibold text-gray-800">{item.price}</p>
        )}

        {item.comment && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.comment}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
          >
            <PinIcon />
            {item.place}
          </a>
          <span className="text-gray-400">
            <time dateTime={toDateAttribute(item.checkedAt)}>
              {formatDate(item.checkedAt)}
            </time>
            時点
            {stale && (
              <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                要確認
              </span>
            )}
          </span>
        </div>

        {item.japanUrl && (
          <p className="mt-2 text-xs">
            <a
              href={item.japanUrl}
              target="_blank"
              rel={item.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
              className="text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-emerald-700"
            >
              日本で買えるお店を見る
            </a>
            {item.sponsored && (
              <span className="ml-1.5 rounded border border-gray-300 px-1 text-[10px] text-gray-500">
                PR
              </span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}

function PinIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default SouvenirGuide;
