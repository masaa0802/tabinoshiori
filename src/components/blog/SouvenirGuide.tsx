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
 * 記事内のお土産ガイド。品をジャンルごとに分け、カードで並べる。
 *
 * 1枚のカードで読者が判断できるようにしているのは次の4点。
 * - 日本でも買えるか（写真の上のバッジ）
 * - いくらか（価格ピル）
 * - どこで買えるか（地図リンクつき）
 * - いつ時点の情報か（確認日。6か月を過ぎると「要確認」）
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

function minPriceYen(souvenirs: Souvenir[]): number | undefined {
  const prices = souvenirs
    .map((item) => item.priceYen)
    .filter((price): price is number => typeof price === "number");
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

const SouvenirGuide: React.FC<SouvenirGuideProps> = ({ souvenirs }) => {
  if (souvenirs.length === 0) return null;

  const groups = groupByGenre(souvenirs);
  const localOnlyCount = souvenirs.filter((item) => !item.availableInJapan).length;
  const updatedAt = latestCheckedAt(souvenirs);
  const minPrice = minPriceYen(souvenirs);

  const stats = [
    { value: `${souvenirs.length}`, label: "紹介アイテム" },
    { value: `${localOnlyCount}`, label: "現地限定" },
    ...(minPrice !== undefined
      ? [{ value: `¥${minPrice.toLocaleString("ja-JP")}〜`, label: "価格帯" }]
      : []),
  ];

  return (
    <section aria-label="お土産ガイド" className="mt-12">
      {/* 概要とジャンル目次 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 px-5 py-8 text-center sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-100/70"
        />
        <div className="relative">
          <span className="inline-block rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-orange-600 shadow-sm">
            SOUVENIR GUIDE
          </span>

          <dl className="mt-6 flex justify-center gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 flex-1 flex-col-reverse rounded-2xl bg-white px-2 py-4 shadow-sm sm:max-w-[10rem] sm:px-4"
              >
                <dt className="mt-1 text-[10px] leading-snug text-gray-500 sm:text-[11px] sm:tracking-wide">
                  {stat.label}
                </dt>
                <dd className="text-xl font-bold text-orange-600 sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          {updatedAt && (
            <p className="mt-5 text-xs text-gray-500">
              最終確認日{" "}
              <time dateTime={toDateAttribute(updatedAt)} className="font-semibold text-gray-700">
                {formatDate(updatedAt)}
              </time>
              <span className="ml-1">（価格・販売場所は品ごとに確認日を記載）</span>
            </p>
          )}

          {groups.length > 1 && (
            <nav aria-label="ジャンル" className="mt-8">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-gray-400">
                JUMP TO
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {groups.map((group) => (
                  <li key={group.anchor}>
                    <a
                      href={`#${group.anchor}`}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-orange-300"
                    >
                      {group.genre}
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] text-orange-700">
                        {group.items.length}件
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      {groups.map((group) => {
        const localOnly = group.items.filter((item) => !item.availableInJapan).length;
        return (
          <section key={group.anchor} id={group.anchor} className="mt-14 scroll-mt-20">
            <h2 className="text-2xl font-bold text-gray-900">{group.genre}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {group.items.length}件
              {localOnly > 0 && `・うち現地限定 ${localOnly}件`}
            </p>
            <div className="mt-4 h-0.5 rounded-full bg-orange-100" />

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {group.items.map((item) => (
                <SouvenirCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-orange-100/80 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-gray-100">
        {item.photo ? (
          <Image
            src={optimizedImageUrl(item.photo.url, 720)}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <CoverPlaceholder categorySlug={item.genre} categoryName={item.genre} />
        )}

        {/* いちばん知りたい「日本でも買えるか」は写真の上に出す */}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
            item.availableInJapan
              ? "bg-white/95 text-gray-600"
              : "bg-rose-500 text-white"
          }`}
        >
          {item.availableInJapan ? "日本でも買える" : "現地でしか買えない"}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-gray-900">{item.name}</h3>

        {item.price && (
          <p className="mt-3 self-start rounded-full bg-orange-100 px-3.5 py-1.5 text-sm font-bold text-orange-700">
            {item.price}
          </p>
        )}

        {item.comment && (
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.comment}</p>
        )}

        <dl className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div className="flex items-start gap-1.5">
            <dt className="flex-shrink-0">
              <PinIcon />
              <span className="sr-only">買える場所</span>
            </dt>
            <dd className="min-w-0">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-2 hover:text-orange-700"
              >
                {item.place}
              </a>
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="flex-shrink-0">
              <CalendarIcon />
              <span className="sr-only">確認日</span>
            </dt>
            <dd>
              <time dateTime={toDateAttribute(item.checkedAt)}>
                {formatDate(item.checkedAt)}
              </time>
              時点
              {stale && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                  要確認
                </span>
              )}
            </dd>
          </div>
        </dl>

        {item.japanUrl && (
          <div className="mt-auto flex items-center gap-2 pt-5">
            <a
              href={item.japanUrl}
              target="_blank"
              rel={item.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              日本で買えるお店を見る
            </a>
            {item.sponsored && (
              <span className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                PR
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PinIcon() {
  return (
    <svg
      className="mt-px h-4 w-4 text-orange-500"
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

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 text-orange-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export default SouvenirGuide;
