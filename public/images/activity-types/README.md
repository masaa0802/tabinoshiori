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

## 仕様

- viewBox は全て `0 0 800 360`（約 2.22:1）。`object-cover` でヘッダー（`h-44` / `md:h-52`）に敷く前提。
- 下端 80px 前後はタイトル・バッジが重なるため、主役のモチーフを上寄せし、下部は無地に近い帯にしてある。
- 重ねる暗幕は `from-black/55 via-black/10` 程度が最適（`from-black/70` だとパステルが濁る）。

## 動き付き版（`motion/`）

同じ絵柄に微妙な動きを付けたものが `motion/` に入っている。ファイル名は静止版と同じ。
`scripts/build-activity-type-motion.js` が静止版から生成するので、**絵を直す時は静止版だけ編集して再生成する**。

| ファイル | 動くもの |
| --- | --- |
| `transport.svg` | 雲の横流れ、車体と飛行機の上下、スピードライン |
| `sightseeing.svg` | 太陽のにじみ、雲、レンズのきらり |
| `restaurant.svg` | 湯気3本（1.1秒ずつずらし） |
| `hotel.svg` | 星・窓明かりの瞬き、ランプの灯り |
| `activity.svg` | 気球の浮遊、雲 |
| `area.svg` | ピンの上下と影 |
| `default.svg` | スーツケースの上下、雲 |

- CSS アニメーションのみ（SMIL・JS なし）。`<img>` / `next/image` から参照しても動く。
- `transform` と `opacity` だけを使い、`prefers-reduced-motion: reduce` で全て停止する。
  停止用の `@media` は `<style>` の最後に置くこと（後勝ちで上書きするため、位置を変えると効かなくなる）。

### 使い分け（計測値）

Chromium ヘッドレス・GPU 無効（ソフトウェア描画）での 8 秒あたりの CPU 時間。実機ではもっと軽いが、相対差の目安になる。

| 条件 | CPU |
| --- | --- |
| 静止版 12 枚を表示 | 0.11 秒 |
| 動き付き 1 枚を表示 | 1.12 秒 |
| 動き付き 12 枚を表示 | 3.75 秒 |
| 動き付き 12 枚（reduced-motion 有効） | 0.10 秒 |

`<img>` 内の SVG アニメーションは合成（compositor）に載らず毎フレーム再ラスタライズされるため、**画面に出る枚数に比例して重くなる**。

- 詳細シート / 詳細モーダル（同時に 1 枚）→ `motion/` を使う
- リストカード / 地図カード（同時に 5〜10 枚）→ 静止版を使う
