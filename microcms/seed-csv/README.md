# サンプル記事のCSVインポート

`src/data/blogPosts.ts` のシードデータ（サンプル記事4本）を、microCMS に
CSVインポートするためのファイル。

動作確認用のサンプルであり、そのまま公開する前提のコンテンツではない。
とくに `cheap-flight-timing` の金額は**レイアウト確認用のサンプル値**なので、
公開するなら必ず実際に調査した数値と出典に差し替えること。

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
