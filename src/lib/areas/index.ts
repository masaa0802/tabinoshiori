/**
 * 記事を「エリア → 国 → 地域」に振り分ける。
 *
 * 紐づけのルールは src/data/areas.ts の冒頭コメントを参照。
 * 記事の取得は呼び出し側（ページ）で行い、ここでは振り分けだけをする。
 */
import type { BlogPost } from "@/lib/microcms/types";
import {
  AREA_GROUPS,
  COUNTRIES,
  REGIONS,
  type Area,
  type AreaGroup,
  type Country,
  type Region,
} from "@/data/areas";

export type RegionEntry = { region: Region; posts: BlogPost[] };

export type CountryEntry = {
  country: Country;
  /** 国内のどこかに紐づくすべての記事（重複なし、新着順のまま） */
  posts: BlogPost[];
  /** マスタにある地域すべて。記事のない地域は posts が空 */
  regions: RegionEntry[];
  /** 国だけが書かれていて、どの地域にも紐づかない記事 */
  countryWidePosts: BlogPost[];
};

export type AreaEntry = { area: Area; countries: CountryEntry[] };
export type AreaGroupEntry = { group: AreaGroup; areas: AreaEntry[] };

function normalize(value: string): string {
  return value.trim().normalize("NFKC");
}

function matches(value: string, target: { name: string; aliases: string[] }): boolean {
  const word = normalize(value);
  return [target.name, ...target.aliases].some((name) => normalize(name) === word);
}

/** 記事の destination から、紐づく国と地域を取り出す */
export function placesOfPost(post: BlogPost): { countries: Country[]; regions: Region[] } {
  const regions = REGIONS.filter((region) =>
    post.destinations.some((value) => matches(value, region))
  );
  const countrySlugs = new Set(regions.map((region) => region.country));
  for (const country of COUNTRIES) {
    if (post.destinations.some((value) => matches(value, country))) {
      countrySlugs.add(country.slug);
    }
  }
  return {
    countries: COUNTRIES.filter((country) => countrySlugs.has(country.slug)),
    regions,
  };
}

/**
 * 記事を国ごとにまとめる。記事が1本もない国は含めない。
 * 並び順は記事の多い国から。同数ならマスタの順。
 */
export function buildCountryEntries(posts: BlogPost[]): CountryEntry[] {
  const entries = new Map<string, CountryEntry>();

  const entryOf = (country: Country): CountryEntry => {
    let entry = entries.get(country.slug);
    if (!entry) {
      entry = {
        country,
        posts: [],
        regions: REGIONS.filter((region) => region.country === country.slug).map((region) => ({
          region,
          posts: [],
        })),
        countryWidePosts: [],
      };
      entries.set(country.slug, entry);
    }
    return entry;
  };

  for (const post of posts) {
    const { countries, regions } = placesOfPost(post);
    for (const country of countries) {
      const entry = entryOf(country);
      entry.posts.push(post);
      const own = regions.filter((region) => region.country === country.slug);
      if (own.length === 0) {
        entry.countryWidePosts.push(post);
      }
      for (const region of own) {
        entry.regions.find((item) => item.region.slug === region.slug)?.posts.push(post);
      }
    }
  }

  const order = (slug: string) => COUNTRIES.findIndex((country) => country.slug === slug);
  return [...entries.values()].sort(
    (a, b) => b.posts.length - a.posts.length || order(a.country.slug) - order(b.country.slug)
  );
}

/** エリアのグループごとにまとめる。記事のないグループも、準備中として表示するため残す */
export function buildAreaGroupEntries(countries: CountryEntry[]): AreaGroupEntry[] {
  return AREA_GROUPS.map((group) => ({
    group,
    areas: group.areas.map((area) => ({
      area,
      countries: countries.filter((entry) => entry.country.area === area.slug),
    })),
  }));
}

/** 重複を除いた記事数 */
export function countPosts(areas: AreaEntry[]): number {
  const slugs = new Set<string>();
  for (const area of areas) {
    for (const entry of area.countries) {
      for (const post of entry.posts) slugs.add(post.slug);
    }
  }
  return slugs.size;
}
