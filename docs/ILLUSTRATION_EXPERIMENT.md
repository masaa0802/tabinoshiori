# イラストの効果測定（A/B テスト）

旅程の一覧カードと詳細シートのイラストに、利用を増やす効果があるかを測るための仕組み。

## しくみ

ブラウザごとにランダムで2つの群に分け、同じ期間の行動を比べる。

| 群 | `illustration_variant` | 見た目 |
| --- | --- | --- |
| イラストあり | `with` | 一覧カードの右端と詳細シートの上部にイラストを出す（通常の見た目） |
| イラストなし（対照群） | `without` | 一覧カードは白いカード、詳細シートの上部は種別の色の帯だけ |

- 群は初回表示時に 50% ずつランダムに決め、`localStorage` に保存する（キー: `tabinoshiori:experiment:illustration_v1`）。同じブラウザなら次に来た時も同じ群。
- イラスト以外（切符風のデザイン、営業時間チェックなど）は両群とも同じ。違いはイラストの有無だけ。
- 設定とロジックは `src/lib/illustrationExperiment.ts`。GA4 への送信は `src/lib/analytics.ts`。

### 表示の確認

URL に `?illustration=with` か `?illustration=without` を付けると、そのブラウザはその群に固定される（以降は付けなくても同じ群）。

## 送っているイベント（GA4）

全てのイベントに `experiment_id`（`illustration_v1`）と `illustration_variant`（`with` / `without`）が付く。
ユーザープロパティにも `illustration_variant` を入れている。

| イベント | いつ | 主なパラメータ |
| --- | --- | --- |
| `itinerary_view` | アクティビティが1件以上あるしおりを表示した時（しおりごとに1回）。**比較の分母** | `activity_count` |
| `activity_detail_open` | 詳細シートを開いた時 | `activity_type`, `image_key`, `is_scene` |
| `activity_detail_close` | 詳細シートを閉じた時（開いたままタブを閉じた時も） | 上と同じ + `open_seconds`（開いていた秒数。上限 1800） |
| `activity_detail_action` | 詳細シートのボタンを押した時 | 上と同じ + `action`（`map` / `edit` / `delete` / `budget`） |
| `activity_add` | アクティビティを追加した時 | `activity_type`, `image_key`, `is_scene` |

- `image_key` は表示した（対照群では「表示していたら出ていた」）イラストのキー（`shrine`、`ramen`、`hotel` など）。
- `is_scene` はシーン別イラスト（26種）なら `true`、種別イラストなら `false`。
- `action: delete` は削除ボタンを押した時点で送る（確認ダイアログでキャンセルした場合も含む）。

## GA4 側の準備（最初に1回）

イベントのパラメータはそのままではレポートに出ないので、GA4 の管理画面で登録する。
**登録した日以降のデータしか集計できない**ので、リリースと同時に登録しておくこと。

「管理」→「データの表示」→「カスタム定義」で以下を作成する。

| 種類 | 名前（表示名） | 範囲 | パラメータ / プロパティ |
| --- | --- | --- | --- |
| カスタムディメンション | イラストの群 | ユーザー | `illustration_variant` |
| カスタムディメンション | イラストの群（イベント） | イベント | `illustration_variant` |
| カスタムディメンション | イラストのキー | イベント | `image_key` |
| カスタムディメンション | シーン別イラスト | イベント | `is_scene` |
| カスタムディメンション | アクティビティ種別 | イベント | `activity_type` |
| カスタムディメンション | 詳細シートの操作 | イベント | `action` |
| カスタム指標 | 詳細シートを開いていた秒数 | イベント | `open_seconds`（単位: 秒） |

本番の環境変数 `NEXT_PUBLIC_GA_MEASUREMENT_ID` が設定されていないとイベントは送られない。

## 結果の見方

GA4 の「探索」→「自由形式」で、行に「イラストの群（イベント）」を置き、以下を比べる。

| 見たいこと | 計算 |
| --- | --- |
| 詳細を開く人の割合 | `activity_detail_open` のユーザー数 ÷ `itinerary_view` のユーザー数 |
| 1回の表示あたりの詳細を開く回数 | `activity_detail_open` のイベント数 ÷ `itinerary_view` のイベント数 |
| 詳細を読む時間 | `activity_detail_close` の「詳細シートを開いていた秒数」の平均 |
| 行動につながったか | `activity_detail_action` の回数（`action` 別）÷ `itinerary_view` のユーザー数 |
| しおりを作り込むか | `activity_add` のイベント数 ÷ `itinerary_view` のユーザー数 |
| また来るか | 「探索」→「コホート」で、「イラストの群」（ユーザー）別のリテンション |

どのイラストが効いているかは、`with` 群だけに絞り、行を「イラストのキー」や「シーン別イラスト」にして、キーごとの詳細を開く回数を比べる。
（`without` 群にも同じキーが付いているので、キーごとに `with` と `without` を並べて比べることもできる。）

### どれくらい続ければよいか

差が小さいほど多くの人数が必要になる。「詳細を開く人の割合」で見る場合の目安（有意水準 5%、検出力 80%）:

| 元の割合 → 期待する割合 | 1群あたり必要な `itinerary_view` のユーザー数 |
| --- | --- |
| 40% → 50%（10ポイント差） | 約 400 人 |
| 40% → 45%（5ポイント差） | 約 1,500 人 |

曜日による偏りを避けるため、人数が足りても **最低 2 週間** は続ける。途中で結果を何度も見て、良さそうな時点で止めるのは避ける（偶然の差を効果と見誤りやすい）。

## 実験を終える

`src/lib/illustrationExperiment.ts` の `ILLUSTRATION_EXPERIMENT.active` を `false` にしてリリースすると、全員にイラストが出る（イベントは引き続き `illustration_variant: "with"` で送られる）。
新しい実験を始める時は `id` を変える（`illustration_v2` など）。群の保存キーも変わるので、全員が振り分け直される。
