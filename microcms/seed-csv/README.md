# サンプル記事のCSVインポート

`src/data/blogPosts.ts` のシードデータ（サンプル記事4本）を、microCMS に
CSVインポートするためのファイル。

動作確認用のサンプルであり、そのまま公開する前提のコンテンツではない。
とくに `cheap-flight-timing` の金額は**レイアウト確認用のサンプル値**なので、
公開するなら必ず実際に調査した数値と出典に差し替えること。

---

## CSVの代わりにスクリプトで入れる（推奨）

`scripts/import-microcms.mjs` を使うと、CSVでは扱えない参照フィールド
（`category` / `spots`）とセレクトフィールド（`tags`）もまとめて設定できる。
記事を1件ずつ開いて手で直す作業がなくなる。

**書き込み権限つきのAPIキーが必要。**（デフォルトキーはGETのみのことが多い。
サービス設定 → APIキー で PUT を許可する）

```bash
export MICROCMS_SERVICE_DOMAIN=lisczn7nn1
export MICROCMS_API_KEY=<書き込み権限のあるキー>

node scripts/import-microcms.mjs            # 何が送られるか表示するだけ
node scripts/import-microcms.mjs --apply    # 実際に送る（下書きとして作成）
```

既定で**下書き**として作成される。このシードは動作確認用のサンプルで、
とくに `cheap-flight-timing` の金額は仮の値のため、そのまま公開してはいけない。
公開状態で入れたい場合のみ `--publish` を付ける。

`contentId` を指定した PUT なので、同じIDで再実行すると上書きになる。
途中で失敗しても、直してもう一度流せばよい。

キーは環境変数からのみ読む。スクリプトにもコマンドライン引数にも書かないこと。

### うまくいかない場合

| 症状 | 原因 | 対処 |
|---|---|---|
| 401 / 403 | APIキーに書き込み権限がない | サービス設定 → APIキーで PUT を許可 |
| 400 `coverImage` | 必須フィールドだが画像はAPIで設定できない | スキーマで一時的に「必須」を外す |
| 404 | エンドポイント名かサービスIDの誤り | `articles` / `categories` / `spots` と `MICROCMS_SERVICE_DOMAIN` を確認 |

以下は手作業でCSVを入れる場合の手順。

---

## インポートする順番

参照される側から先に入れる。

1. `categories.csv` → `categories` API
2. `spots.csv` → `spots` API
3. `articles.csv` → `articles` API

---

## CSVで入らない項目

microCMS のCSVインポートは、参照フィールドとメディアフィールドを扱えない。
インポート後に各記事を開いて手作業で設定する。

| 記事のコンテンツID | category | spots |
|---|---|---|
| `kyoto-2days-guide` | `model-course` | `kiyomizu-dera`, `fushimi-inari`, `nishiki-market` |
| `first-overseas-packing-list` | `preparation` | （なし） |
| `cheap-flight-timing` | `preparation` | （なし） |
| `taipei-travel-guide` | `destination-guide` | `taipei-101`, `shilin-night-market` |

`coverImage` は全記事で未設定。画像をアップロードして設定する。
未設定でもページは壊れず、グラデーションのプレースホルダが表示される。

### `tags`（不安タグ）が入らなかった場合

`tags` はセレクトフィールド（複数選択）なので、CSVの値が選択肢の文字列と一致すれば
入るはず**だが、未検証**。入らなかった場合は各記事を開いて手で選び直す。

| 記事のコンテンツID | tags |
|---|---|
| `kyoto-2days-guide` | 段取りの不安 |
| `first-overseas-packing-list` | 手続きの不安 |
| `cheap-flight-timing` | お金の不安 |
| `taipei-travel-guide` | 現地の不安 |

`freeTags` はテキストフィールドなので、こちらは通常どおり入る。

---

## contentId 列について

記事URLは `/blog/<コンテンツID>` になるため、コンテンツIDは英数字で管理したい。
そのため各CSVの1列目に `contentId` を入れてある。

**この列が原因でインポートが失敗する場合は、1列目を削除して再実行すること。**

### 列数はスキーマと完全一致させること

microCMS のCSVインポートは、**列数がAPIスキーマのフィールド数（contentId含む）と
一致していないと受け付けない**。値が空でも列そのものは必要。

> CSVデータの列数が、APIスキーマのフィールド数（コンテンツID含む）と異なります。

このエラーが出たらこれ。参照フィールド（`category` / `spots`）と画像フィールド
（`coverImage` / `ogImage` / `photo`）も、空の列として用意しておく必要がある。
スキーマを変えたらCSVの列も合わせて直すこと。
その場合コンテンツIDはランダムな文字列で自動生成されるので、各コンテンツの
「コンテンツIDを変更」から上の表のIDに手で直す必要がある。

---

## 本文（body）について

シードデータはブロック配列で本文を持っているため、microCMS のリッチエディタ用に
HTML へ変換してある。見出しは `<h2>`、段落は `<p>`、箇条書きは `<ul><li>`、
引用は `<blockquote>`。

`PriceNote` コンポーネントは本文HTMLでは使えないため、金額ブロックは
引用ブロックとして書き出し、金額・条件・出典・調査時点を本文中に含めてある。

---

## 生成し直す場合

シードデータを変更したあとにCSVを作り直す手順は特に用意していない。
`src/data/blogPosts.ts` を読んで手で更新するか、生成スクリプトを書き直すこと。
このCSVは初回投入用の使い捨てを想定している。
