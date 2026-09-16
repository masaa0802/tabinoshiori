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
