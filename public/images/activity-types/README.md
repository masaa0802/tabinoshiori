# アクティビティ種別イラスト

アクティビティ詳細のヘッダー（Google カレンダー風の上部イラスト）用のフォールバック画像。
Google Places の写真が無いアクティビティで使う想定。

| ファイル | type | ラベル | ベース色 |
| --- | --- | --- | --- |
| `transport.svg` | `transport` | 交通 | `#3B82F6` |
| `sightseeing.svg` | `sightseeing` | 観光スポット | `#10B981` |
| `restaurant.svg` | `restaurant` | 飲食店 | `#F59E0B` |
| `hotel.svg` | `hotel` | ホテル | `#8B5CF6` |
| `activity.svg` | `activity` | アクティビティ | `#EF4444` |
| `area.svg` | `area` | エリア | `#6B7280` |
| `default.svg` | 上記以外 | - | `#4FB3A5` |

## シーン別イラスト

種別（DB の `type`）は増やさず、アクティビティ名のキーワードから種別より細かいイラストを選ぶ。
判定ルールは `src/lib/activityTypeImage.ts` の `SCENES`（上から順に判定し、最初に当たったもの）。
どれにも当たらなければ上の種別イラストを使う。各シーンは使ってよい種別が決まっていて、
「山田屋」（飲食店）が山のイラストになる、といった誤判定を防いでいる。

| 元の種別 | ファイル（シーン） |
| --- | --- |
| 交通 | `airport` 空港・飛行機 / `ferry` 船・港 / `bus` バス / `car` レンタカー・ドライブ |
| 飲食店 | `ramen` / `sushi` / `noodles` そば・うどん / `yakiniku` 焼肉・焼鳥 / `izakaya` 居酒屋・バー / `sweets` / `cafe` |
| ホテル | `ryokan` 旅館・温泉宿 / `camp` キャンプ・グランピング |
| 観光・アクティビティ・エリア | `onsen` / `shrine` 神社 / `temple` 寺 / `castle` 城 / `theme_park` / `aquarium` 水族館・動物園 / `museum` 美術館・博物館 / `tower` タワー・展望 / `ski` / `beach` / `mountain` 山・湖・滝 / `garden` 公園・庭園 / `shopping` 買い物・市場 |

シーンを足す時は、静止版 SVG を置いて `SCENES` にルールを足し、動き付き版を再生成する。
シーンの静止版には最初から `class="tn-*"` を書いておく（下の「動き付き版」参照）。

## 仕様

- viewBox は全て `0 0 800 360`（約 2.22:1）。`object-cover` でヘッダー（`h-44` / `md:h-52`）に敷く前提。
- 下端 80px 前後はタイトル・バッジが重なるため、主役のモチーフを上寄せし、下部は無地に近い帯にしてある。
- 重ねる暗幕は `from-black/55 via-black/10` 程度が最適（`from-black/70` だとパステルが濁る）。

## 動き付き版（`motion/`）

同じ絵柄に微妙な動きを付けたものが `motion/` に入っている。ファイル名は静止版と同じ。
`scripts/build-activity-type-motion.js` が静止版から生成するので、**絵を直す時は静止版だけ編集して再生成する**。

- 種別イラスト（下表）はスクリプト内の置換表で動かす要素に class を付ける。
- シーンイラストは静止版に `tn-bob` / `tn-drift` / `tn-steam` などの class を直接書いてあり、
  スクリプトは `<style>` を差し込むだけ（静止版には `<style>` が無いので動かない）。
  class を付けた要素には `transform` 属性を付けないこと（アニメーションの transform で上書きされる）。

| ファイル | 動くもの |
| --- | --- |
| `transport.svg` | 線路の流れ、車体と飛行機の上下、スピードライン、雲 |
| `sightseeing.svg` | カメラ本体の上下、太陽のにじみ、レンズのきらり、雲 |
| `restaurant.svg` | 湯気3本（0.8秒ずつずらし）、皿のゆっくりした上下 |
| `hotel.svg` | 星・窓明かりの瞬き、月の呼吸、ランプの灯り |
| `activity.svg` | 気球の浮遊（上下＋傾き）、雲 |
| `area.svg` | ピンの上下と影、ルート点線の流れ |
| `default.svg` | スーツケースの上下、雲 |

- CSS アニメーションのみ（SMIL・JS なし）。`<img>` / `next/image` から参照しても動く。
- `transform` と `opacity` だけを使い、`prefers-reduced-motion: reduce` で全て停止する。
  停止用の `@media` は `<style>` の最後に置くこと（後勝ちで上書きするため、位置を変えると効かなくなる）。

### 使い分け（計測値）

Chromium ヘッドレス・GPU 無効（ソフトウェア描画）での 8 秒あたりの CPU 時間。実機ではもっと軽いが、相対差の目安になる。

| 条件 | CPU |
| --- | --- |
| 静止版 12 枚を表示 | 0.11 秒 |
| 動き付き 1 枚を表示 | 1.05 秒 |
| 動き付き 12 枚を表示 | 3.79 秒 |
| 動き付き 12 枚（reduced-motion 有効） | 0.08 秒 |

`<img>` 内の SVG アニメーションは合成（compositor）に載らず毎フレーム再ラスタライズされるため、**画面に出る枚数に比例して重くなる**。

- 詳細シート / 詳細モーダル（同時に 1 枚）→ `motion/` を使う
- リストカード / 地図カード（同時に 5〜10 枚）→ 静止版を使う

パスは `src/lib/activityTypeImage.ts` の `getActivityTypeImage({ type, name }, { motion })` で組み立てる。
現在の利用箇所は `ActivityDetailSheet`（写真の有無にかかわらず常にイラスト）と
`ActivityDetailModal`（写真が無い時）。どちらも `motion: true`。

旅程の一覧カードは `ActivityCardIllustration` でカード右端に静止版を敷き、左へマスクでフェードさせている。
文字の列には `pr-[min(34%,180px)]` の余白を取り、イラストの濃い部分に文字が入らないようにしている。

### キャッシュ

`next.config.ts` の `headers()` で `/images/activity-types/:path*` に
`public, max-age=31536000, immutable` を付けている。既定の `public, max-age=0` だと
シートを開くたびに 304 の問い合わせが飛ぶため。

**イラストを差し替えたら `activityTypeImage.ts` の `ASSET_VERSION` を上げること。**
上げない限りブラウザは古い画像を使い続ける。

初回だけは取得が入るので、旅程ページの描画時に `preloadActivityTypeImages()` で
その旅程に出てくるイラストぶんを先読みしている（`<link rel="preload" as="image">`）。
先読みする URL は詳細シートが要求するものと同一にすること。ズレるとキャッシュが再利用されない。
