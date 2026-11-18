/**
 * 「地図から探す」で使う、エリア・国・地域のマスタ。
 *
 * 記事との紐づけは microCMS の「関連する目的地（destination）」で行う。
 * destination をカンマ区切りで分けた各語が、ここにある国・地域の name か aliases と
 * **完全一致**したときに、その国・地域の記事として扱う（部分一致にしないのは、
 * 「バリ」が「バリ島」と「バリャドリード」の両方に当たるような取り違えを防ぐため）。
 *
 * 記事に「アユタヤ, タイ」と書けば、タイ→アユタヤの記事になる。
 * 地域だけ書いた場合も、その地域の国に自動で入る。
 * 国だけ書いた記事は、国のページの「◯◯全体の記事」に並ぶ。
 *
 * 新しい国・地域の記事を書くときは、先にここへ追加すること。
 * 地図に出るのは、記事が1本以上ある国だけ。マスタに先に足しておいても表には出ない。
 */

/** [経度, 緯度] */
export type LonLat = [number, number];
/** 地図に収める範囲。[南西の角, 北東の角] */
export type Bounds = [LonLat, LonLat];

export type AreaGroup = {
  slug: string;
  name: string;
  /** グループ内の小分け。2つ以上に記事があるときだけ小分けのボタンを出す */
  areas: Area[];
};

export type Area = {
  slug: string;
  name: string;
  /** 世界地図でこのエリアを選んだときに大きく映す範囲 */
  bounds: Bounds;
};

export type Country = {
  slug: string;
  name: string;
  /** destination で使われうる別名 */
  aliases: string[];
  /** world-atlas の国ID（ISO 3166-1 の3桁の数字コード） */
  isoNumeric: string;
  /** 属するエリアの slug */
  area: string;
  /** 国ページの見出しの上に添える手書き風のひとこと */
  kicker: string;
  /** 国ページの導入文 */
  lead: string;
  /** 国ページで映す範囲。海外領土を持つ国など、国の形から決めるとずれる場合だけ指定する */
  bounds?: Bounds;
  /** 世界地図の札をつなぐ点。国の重心が海や国外に落ちる場合だけ指定する */
  anchor?: LonLat;
};

export type Region = {
  slug: string;
  /** 属する国の slug */
  country: string;
  name: string;
  aliases: string[];
  /** 地図のピンの位置 */
  lonLat: LonLat;
  /** 国ページの地域一覧に出すひとこと */
  summary: string;
  /** 地域ページの見出しの上に添えるひとこと */
  kicker: string;
  /** 地域ページの導入文 */
  lead: string;
};

export const AREA_GROUPS: AreaGroup[] = [
  {
    slug: "asia",
    name: "アジア",
    areas: [
      { slug: "east-southeast-asia", name: "東・東南アジア", bounds: [[92, -11], [146, 45]] },
      { slug: "south-asia", name: "南アジア", bounds: [[60, 4], [98, 36]] },
    ],
  },
  {
    slug: "europe",
    name: "ヨーロッパ",
    areas: [
      { slug: "western-europe", name: "西欧", bounds: [[-10.5, 42.5], [17.5, 58.5]] },
      { slug: "southern-europe", name: "南欧", bounds: [[-9.5, 35.5], [28, 47.5]] },
      { slug: "northern-europe", name: "北欧", bounds: [[4, 54], [32, 71]] },
      { slug: "eastern-europe", name: "東欧", bounds: [[12, 42], [40, 56]] },
    ],
  },
  {
    slug: "north-america",
    name: "北米・ハワイ",
    areas: [{ slug: "north-america", name: "北米・ハワイ", bounds: [[-160, 18], [-60, 55]] }],
  },
  {
    slug: "oceania",
    name: "オセアニア",
    areas: [{ slug: "oceania", name: "オセアニア", bounds: [[112, -47], [179, -9]] }],
  },
  {
    slug: "latin-america",
    name: "中南米",
    areas: [{ slug: "latin-america", name: "中南米", bounds: [[-118, -56], [-34, 32]] }],
  },
  {
    slug: "middle-east-africa",
    name: "中東・アフリカ",
    areas: [{ slug: "middle-east-africa", name: "中東・アフリカ", bounds: [[-18, -35], [60, 42]] }],
  },
];

export const COUNTRIES: Country[] = [
  {
    slug: "japan",
    name: "日本",
    aliases: [],
    isoNumeric: "392",
    area: "east-southeast-asia",
    kicker: "近くて、まだ知らない国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    bounds: [[128.5, 30.5], [146, 45.6]],
  },
  {
    slug: "korea",
    name: "韓国",
    aliases: ["大韓民国"],
    isoNumeric: "410",
    area: "east-southeast-asia",
    kicker: "週末でも行けるおとなりの国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "taiwan",
    name: "台湾",
    aliases: [],
    isoNumeric: "158",
    area: "east-southeast-asia",
    kicker: "はじめての海外にも",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "china",
    name: "中国",
    aliases: ["中華人民共和国"],
    isoNumeric: "156",
    area: "east-southeast-asia",
    kicker: "広い国を、街ごとに",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "hong-kong",
    name: "香港",
    aliases: [],
    isoNumeric: "344",
    area: "east-southeast-asia",
    kicker: "夜景と点心の街",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "thailand",
    name: "タイ",
    aliases: [],
    isoNumeric: "764",
    area: "east-southeast-asia",
    kicker: "ほほえみの国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    anchor: [101, 15.5],
  },
  {
    slug: "vietnam",
    name: "ベトナム",
    aliases: [],
    isoNumeric: "704",
    area: "east-southeast-asia",
    kicker: "南北に長い国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "cambodia",
    name: "カンボジア",
    aliases: [],
    isoNumeric: "116",
    area: "east-southeast-asia",
    kicker: "遺跡の国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "malaysia",
    name: "マレーシア",
    aliases: [],
    isoNumeric: "458",
    area: "east-southeast-asia",
    kicker: "いくつもの文化がまざる国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    anchor: [102, 4],
  },
  {
    slug: "singapore",
    name: "シンガポール",
    aliases: [],
    isoNumeric: "702",
    area: "east-southeast-asia",
    kicker: "小さな国に、ぎゅっと",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    bounds: [[103.55, 1.15], [104.1, 1.48]],
    anchor: [103.82, 1.35],
  },
  {
    slug: "philippines",
    name: "フィリピン",
    aliases: [],
    isoNumeric: "608",
    area: "east-southeast-asia",
    kicker: "7,000の島の国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "indonesia",
    name: "インドネシア",
    aliases: [],
    isoNumeric: "360",
    area: "east-southeast-asia",
    kicker: "島ごとに、ちがう顔",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    anchor: [113.5, -0.5],
  },
  {
    slug: "india",
    name: "インド",
    aliases: [],
    isoNumeric: "356",
    area: "south-asia",
    kicker: "五感がいそがしい国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "france",
    name: "フランス",
    aliases: [],
    isoNumeric: "250",
    area: "western-europe",
    kicker: "街歩きが楽しい国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    bounds: [[-5, 41.3], [9.6, 51.2]],
    anchor: [2.5, 46.6],
  },
  {
    slug: "united-kingdom",
    name: "イギリス",
    aliases: ["英国"],
    isoNumeric: "826",
    area: "western-europe",
    kicker: "古さと新しさが同居する国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    anchor: [-1.8, 52.8],
  },
  {
    slug: "germany",
    name: "ドイツ",
    aliases: [],
    isoNumeric: "276",
    area: "western-europe",
    kicker: "鉄道でめぐる国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "italy",
    name: "イタリア",
    aliases: [],
    isoNumeric: "380",
    area: "southern-europe",
    kicker: "食べて歩く国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
  {
    slug: "spain",
    name: "スペイン",
    aliases: [],
    isoNumeric: "724",
    area: "southern-europe",
    kicker: "太陽と建築の国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    bounds: [[-9.5, 35.8], [4.4, 43.9]],
  },
  {
    slug: "united-states",
    name: "アメリカ",
    aliases: ["米国", "アメリカ合衆国"],
    isoNumeric: "840",
    area: "north-america",
    kicker: "州ごとに、別の国のよう",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
    bounds: [[-125, 24], [-66, 49.5]],
    anchor: [-98, 39],
  },
  {
    slug: "australia",
    name: "オーストラリア",
    aliases: [],
    isoNumeric: "036",
    area: "oceania",
    kicker: "季節が反対の国",
    lead: "地域をえらぶと、その街の記事だけが並びます。",
  },
];

export const REGIONS: Region[] = [
  // インドネシア
  {
    slug: "bali",
    country: "indonesia",
    name: "バリ島",
    aliases: ["バリ"],
    lonLat: [115.19, -8.41],
    summary: "寺院・棚田・ビーチがそろう島",
    kicker: "神々の島",
    lead: "寺院も滝もライステラスも、ひとつの島にそろっています。観光の費用や回り方の記事をまとめました。",
  },
  {
    slug: "jakarta",
    country: "indonesia",
    name: "ジャカルタ",
    aliases: [],
    lonLat: [106.85, -6.21],
    summary: "首都。空の玄関口",
    kicker: "インドネシアの首都",
    lead: "日本からの直行便が着く、インドネシアの玄関口です。",
  },
  {
    slug: "bandung",
    country: "indonesia",
    name: "バンドン",
    aliases: [],
    lonLat: [107.61, -6.91],
    summary: "高原の街。ジャカルタから高速鉄道で",
    kicker: "ジャカルタから高速鉄道で",
    lead: "標高700mほどの高原にある、涼しい街です。",
  },
  // タイ
  {
    slug: "bangkok",
    country: "thailand",
    name: "バンコク",
    aliases: [],
    lonLat: [100.5, 13.75],
    summary: "王宮・市場・屋台めし",
    kicker: "タイの首都",
    lead: "王宮や寺院、市場、屋台めし。旅の起点になる街です。",
  },
  {
    slug: "ayutthaya",
    country: "thailand",
    name: "アユタヤ",
    aliases: [],
    lonLat: [100.57, 14.35],
    summary: "世界遺産の遺跡群。バンコクから日帰り",
    kicker: "バンコクから日帰り",
    lead: "かつての王朝の都で、遺跡群は世界遺産に登録されています。",
  },
  {
    slug: "chiang-mai",
    country: "thailand",
    name: "チェンマイ",
    aliases: [],
    lonLat: [98.98, 18.79],
    summary: "旧市街の寺院とナイトバザール",
    kicker: "北の古都",
    lead: "城壁に囲まれた旧市街に、寺院がいくつも残る街です。",
  },
  {
    slug: "phuket",
    country: "thailand",
    name: "プーケット",
    aliases: [],
    lonLat: [98.34, 7.88],
    summary: "アンダマン海のビーチリゾート",
    kicker: "アンダマン海の島",
    lead: "タイでいちばん大きな島で、ビーチリゾートとして知られています。",
  },
  // 台湾
  {
    slug: "taipei",
    country: "taiwan",
    name: "台北",
    aliases: [],
    lonLat: [121.56, 25.04],
    summary: "夜市と小籠包の街",
    kicker: "台湾の首都",
    lead: "夜市、小籠包、MRTで回れる街歩き。はじめての海外にも向いた街です。",
  },
  // 韓国
  {
    slug: "seoul",
    country: "korea",
    name: "ソウル",
    aliases: [],
    lonLat: [126.98, 37.57],
    summary: "買い物と食べ歩きの街",
    kicker: "韓国の首都",
    lead: "買い物、食べ歩き、王宮めぐり。週末の旅先として人気の街です。",
  },
  // 日本
  {
    slug: "kyoto",
    country: "japan",
    name: "京都",
    aliases: [],
    lonLat: [135.77, 35.01],
    summary: "寺社と町家の街",
    kicker: "千年の都",
    lead: "寺社と町家が残る街です。",
  },
  {
    slug: "tokyo",
    country: "japan",
    name: "東京",
    aliases: [],
    lonLat: [139.69, 35.69],
    summary: "首都。空港から旅が始まる街",
    kicker: "日本の首都",
    lead: "成田・羽田の2つの空港がある、旅の出発地です。",
  },
];

export function findCountry(slug: string): Country | undefined {
  return COUNTRIES.find((country) => country.slug === slug);
}

export function findRegion(countrySlug: string, regionSlug: string): Region | undefined {
  return REGIONS.find((region) => region.country === countrySlug && region.slug === regionSlug);
}

export function regionsOfCountry(countrySlug: string): Region[] {
  return REGIONS.filter((region) => region.country === countrySlug);
}

export function findArea(areaSlug: string): { group: AreaGroup; area: Area } | undefined {
  for (const group of AREA_GROUPS) {
    const area = group.areas.find((item) => item.slug === areaSlug);
    if (area) return { group, area };
  }
  return undefined;
}
