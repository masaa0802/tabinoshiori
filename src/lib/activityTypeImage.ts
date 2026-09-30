import { preload } from "react-dom";

const ACTIVITY_TYPE_KEYS = [
  "transport",
  "sightseeing",
  "restaurant",
  "hotel",
  "activity",
  "area",
] as const;

type ActivityTypeKey = (typeof ACTIVITY_TYPE_KEYS)[number];

const isActivityTypeKey = (type?: string): type is ActivityTypeKey =>
  !!type && (ACTIVITY_TYPE_KEYS as readonly string[]).includes(type);

/**
 * 種別より細かいイラスト（シーン）。アクティビティ名のキーワードで選ぶ。
 *
 * DB の type は予算・地図・管理画面でも使うので増やさず、見た目だけを細かくする。
 * 上から順に判定し、最初に当たったものを使う。`types` はそのシーンを使ってよい
 * 種別で、「山田屋」（飲食店）が山のイラストになる、といった誤判定を防ぐ。
 * どれにも当たらなければ種別のイラストを使う。
 */
const SCENES: ReadonlyArray<{ key: string; types: readonly ActivityTypeKey[]; pattern: RegExp }> = [
  // 交通
  { key: "airport", types: ["transport"], pattern: /空港|飛行機|フライト|航空|✈|ANA|JAL|Peach|ピーチ|ジェットスター|スカイマーク|airport/i },
  { key: "ferry", types: ["transport", "activity", "sightseeing"], pattern: /フェリー|船|港|クルーズ|ジェットフォイル|高速艇|遊覧/ },
  { key: "bus", types: ["transport"], pattern: /バス|シャトル/ },
  { key: "car", types: ["transport", "activity"], pattern: /レンタカー|ドライブ|車|タクシー|カーシェア|高速道路|IC$|SA$|PA$|サービスエリア|パーキングエリア/ },

  // 飲食
  { key: "ramen", types: ["restaurant"], pattern: /ラーメン|らーめん|拉麺|中華そば|つけ麺|担々麺|まぜそば/ },
  { key: "sushi", types: ["restaurant"], pattern: /寿司|鮨|すし|スシ|海鮮|回転/ },
  { key: "noodles", types: ["restaurant"], pattern: /そば|蕎麦|うどん|饂飩|きしめん|ほうとう|素麺|そうめん/ },
  { key: "yakiniku", types: ["restaurant"], pattern: /焼肉|焼き肉|ホルモン|ジンギスカン|BBQ|バーベキュー|ステーキ|焼鳥|焼き鳥/i },
  { key: "izakaya", types: ["restaurant"], pattern: /居酒屋|酒場|バー(?!ガー)|\bBAR\b|ビール|ブルワリー|酒蔵|日本酒|ワイン|立ち飲み|飲み/i },
  { key: "sweets", types: ["restaurant"], pattern: /スイーツ|パフェ|ケーキ|甘味|甘処|アイス|ジェラート|ソフトクリーム|かき氷|パンケーキ|クレープ|和菓子|団子|だんご|チョコ/ },
  { key: "cafe", types: ["restaurant"], pattern: /カフェ|cafe|café|珈琲|コーヒー|喫茶|coffee|ベーカリー|(?<!ジャ)パン(?!ケーキ)|モーニング|朝食|ブランチ/i },

  // 宿泊
  { key: "camp", types: ["hotel", "activity"], pattern: /キャンプ|グランピング|コテージ|バンガロー/ },
  { key: "ryokan", types: ["hotel"], pattern: /旅館|民宿|宿|荘|庵|亭|温泉/ },

  // 観光・アクティビティ（ryokan より後。温泉旅館は ryokan を優先する）
  { key: "onsen", types: ["sightseeing", "activity", "area"], pattern: /温泉|銭湯|足湯|スパ|湯めぐり|サウナ|の湯$/ },
  { key: "shrine", types: ["sightseeing", "area", "activity"], pattern: /神社|神宮|大社|稲荷|八幡|天満宮|鳥居|宮$/ },
  { key: "temple", types: ["sightseeing", "area", "activity"], pattern: /寺|院$|大仏|観音|不動|伽藍|五重塔/ },
  { key: "castle", types: ["sightseeing", "area", "activity"], pattern: /(?<!宮|茨)城|天守/ },
  { key: "theme_park", types: ["activity", "sightseeing"], pattern: /ディズニー|USJ|ユニバーサル|テーマパーク|遊園地|ランド|ワールド|ジブリパーク|富士急/ },
  { key: "aquarium", types: ["sightseeing", "activity"], pattern: /水族館|アクアリウム|海遊館|シーパラダイス|動物園|サファリ|ZOO/i },
  { key: "museum", types: ["sightseeing", "activity"], pattern: /美術館|博物館|記念館|資料館|ミュージアム|museum|ギャラリー|科学館|展示/i },
  { key: "tower", types: ["sightseeing", "activity", "area"], pattern: /タワー|スカイツリー|展望|夜景|ヒルズ|tower/i },
  { key: "ski", types: ["activity", "sightseeing"], pattern: /スキー|スノボ|スノーボード|ゲレンデ/ },
  { key: "beach", types: ["sightseeing", "activity", "area"], pattern: /ビーチ|海水浴|海岸|海辺|砂浜|[ヶが]浜|岬|シュノーケル|ダイビング|サーフィン|マリン|海$/ },
  { key: "mountain", types: ["sightseeing", "activity", "area"], pattern: /(?<!岡|和歌|富|郡|松|徳|白)山$|山頂|岳|登山|高原|峠|ハイキング|トレッキング|ロープウェイ|渓谷|滝|湖|(?<!青)森/ },
  { key: "garden", types: ["sightseeing", "activity", "area"], pattern: /公園|庭園|植物園|花畑|花見|フラワー|桜$|紅葉|梅林|ガーデン|苑|園$/ },
  { key: "shopping", types: ["activity", "sightseeing", "area"], pattern: /ショッピング|買い物|モール|アウトレット|百貨店|デパート|市場|商店街|マーケット|横丁|土産|おみやげ|お土産|ドン・キホーテ|パルコ|PARCO|ヨドバシ|ビックカメラ/i },
] as const;

export const ACTIVITY_SCENE_KEYS = SCENES.map((s) => s.key);

export interface ActivityImageSource {
  type?: string;
  name?: string;
}

/**
 * アクティビティに使うイラストのキー（ファイル名）を返す。
 * シーンに当たればシーン、当たらなければ種別、種別も不明なら default。
 */
export const getActivityImageKey = ({ type, name }: ActivityImageSource): string => {
  const typeKey = isActivityTypeKey(type) ? type : undefined;
  const text = name?.normalize("NFKC").trim();

  if (typeKey && text) {
    const scene = SCENES.find((s) => s.types.includes(typeKey) && s.pattern.test(text));
    if (scene) return scene.key;
  }
  return typeKey ?? "default";
};

/**
 * イラストを描き直したら上げる。next.config.ts で immutable キャッシュを
 * 張っているため、この値を変えない限りブラウザは古い画像を使い続ける。
 */
const ASSET_VERSION = "1";

/**
 * アクティビティのヘッダーイラストのパスを返す。
 *
 * motion: true は動き付き。<img> 内の SVG アニメーションは表示枚数に比例して
 * 重くなるため、同時に1枚しか出ない詳細シート／詳細モーダルだけで使う。
 * リストや地図など何枚も並ぶ場所では静止版（既定）を使うこと。
 */
export const getActivityTypeImage = (
  activity: ActivityImageSource,
  { motion = false }: { motion?: boolean } = {}
) => {
  const name = getActivityImageKey(activity);
  return `/images/activity-types/${motion ? "motion/" : ""}${name}.svg?v=${ASSET_VERSION}`;
};

/**
 * 渡されたアクティビティのヘッダーイラストを先読みする。
 *
 * 詳細シートを初めて開く時だけ画像の取得が入るため、一覧を表示した時点で
 * 出てくるイラストぶんだけ取りに行っておく。2回目以降は immutable キャッシュから
 * 読まれるので、この関数が実際に通信するのはセッションごとに1回だけ。
 * 同じ URL への重複呼び出しは React 側で無視される。
 */
export const preloadActivityTypeImages = (
  activities: ActivityImageSource[],
  options: { motion?: boolean } = {}
) => {
  const seen = new Set<string>();

  for (const activity of activities) {
    const href = getActivityTypeImage(activity, options);
    if (seen.has(href)) continue;
    seen.add(href);
    preload(href, { as: "image" });
  }
};
