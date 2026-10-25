# グループトークンに所有スコープを持たせる（`/api/graphql` の権限設計）

Issue #16 の残課題。PR #38（無認証経路をふさぐ）の続き。

## 1. 何が問題か

- `/api/graphql` は `x-group-token` が**どれか1つでも有効**なら、リクエストを **admin secret のまま** Hasura に転送している（`validateGroupToken` は「存在するか」しか見ていない）。
- そのため、自分のしおりのURL（= トークン）を1つ持っていれば、**他グループの旅程・アクティビティ・予算・予約情報・添付ファイルを読み書き・削除できる**。`{ groups { token } }` で全グループのトークンも取れる。
- 公開操作の `InsertItinerary` は、グループの UUID を知っていれば他グループに旅程を追加できる。
- トークン（しおりのURL）をクライアントで作っている。

## 2. 方針

```
ブラウザ ── x-group-token ──▶ /api/graphql ──▶ Hasura
                               │                 x-hasura-admin-secret
                               │ token → group_id x-hasura-role: group_member
                               └ (5分キャッシュ)   x-hasura-group-id: <group_id>
                                                  └ permission で group_id の行だけに絞る

ブラウザ ── {name, 日程, …} ──▶ /api/groups ──▶ Hasura（admin）
          ◀── {token, itineraryId}               旅程 + グループを1つの mutation で作成
```

1. `/api/graphql` はトークンからグループの id を引き（`resolveGroupId`）、**`group_member` ロール + `x-hasura-group-id`** で Hasura に転送する。Hasura 側の permission が「そのグループの行だけ」に絞る。
   - admin secret 付きのリクエストは `x-hasura-role` などでロールを名乗れる（Hasura の仕様）。これを使うので、**Hasura 側の環境変数（JWT や webhook）の変更は要らない**。admin secret はサーバーの中だけにあり、クライアントのヘッダーは転送しない。
2. グループと最初の旅程の作成は **`/api/groups`（新設）** がサーバー側で行う。トークンもサーバーで作って返す（`crypto.randomBytes(16)`、16進32桁）。旅程から `group` をネストして insert するので、1回の mutation（1トランザクション）で済む。
3. その結果 `/api/graphql` からトークン不要の公開操作（`InsertGroup` / `InsertItinerary`）が無くなる。PR #38 の parse による判定も不要になったので削除した。
4. `group_member` には `groups` / `itineraries` の insert 権限を与えない。作成の入口は `/api/groups` だけになる。

### 検討して採らなかった案

| 案 | 採らなかった理由 |
| --- | --- |
| `/api/graphql` で query を parse して、変数の `itinerary_id` などが自グループのものか確かめる | 操作ごとに検査を書く必要があり、リレーション経由の読み出しやネストした insert の抜けを防ぎきれない。権限は DB 側（Hasura permission）で行単位に強制するのが確実 |
| JWT モード（`HASURA_GRAPHQL_JWT_SECRET`）に切り替え、クライアントが JWT を持つ | Hasura Cloud の環境変数変更が必要で、ロールバックも重い。今はサーバー経由でしか Hasura をたたかないので、admin secret + ロール指定で足りる |
| トークンを Hasura のセッション変数に入れ、permission で `group.token` を比較 | 動くが、全テーブルの filter がトークン比較になる。id で絞るほうが単純で速い（`itineraries.group_id` にはインデックスがある） |

## 3. `group_member` の permission

定義の本体は [`hasura-project/scripts/group-member-permissions.mjs`](../hasura-project/scripts/group-member-permissions.mjs) の `PERMISSIONS`。ローカル用メタデータ（`hasura-project/metadata/databases/default/tables/*.yaml`）はこれを適用して export したもの。

`G` = `{ _eq: X-Hasura-Group-Id }`

| テーブル | select（行の条件） | insert | update | delete |
| --- | --- | --- | --- | --- |
| groups | `id = G`（列: id, name, token, created_at, updated_at） | なし | なし | なし |
| itineraries | `group_id = G` | なし（`/api/groups` が作る） | `group_id = G`。列は title, destination, start_date, end_date, travel_purpose, location_type, total_budget（**group_id は変更不可**） | なし |
| activities | `itinerary.group_id = G` | 同左を check | 同左（itinerary_id は変更不可） | 同左 |
| budgets | `itinerary.group_id = G` | 同左 **かつ** `activity_id` が null か自グループのアクティビティ | 同左 | 同左 |
| travel_documents | `itinerary.group_id = G` | 同左を check | 同左（updated_at を含む） | 同左 |
| document_files | `travel_document.itinerary.group_id = G` | 同左を check（`InsertTravelDocument` のネスト insert も含む） | なし（使っていない） | 同左 |
| users / group_members / documents | なし | なし | なし | なし |

- insert / update の列は、**いまアプリが送っている列だけ**（`src/graphql/mutates.ts`）。アプリが本番で使えている列なので、本番に存在することが分かっている。
- `groups.token` は自グループの行だけ見える。`GetItineraryByTokenAndId` が `where: { group: { token: … } }` を使うため（where に使う列は select 権限が要る）。
- filter がたどるリレーション（`activities.itinerary`、`budgets.itinerary`、`budgets.activity`、`travel_documents.itinerary`、`document_files.travel_document`、`itineraries.group`）は、本番に無ければスクリプトが外部キーから作る。
- `itineraries.group_id` が null の旅程（グループ削除で `ON DELETE SET NULL` されたもの）はどのグループからも見えなくなる。これまでは誰からでも見えていた。

## 4. 本番への影響

### 変わること

- 他グループのデータは読めず、書けず、消せなくなる（GraphQL のエラー、または `null` / 空配列が返る）。
- 自グループのしおりの操作は、これまでと同じ GraphQL がそのまま通る（ローカルで全操作を確認済み。§7）。
- しおりの新規作成は `/group/new` → `POST /api/groups` に変わる。画面の見た目と遷移先（`/group/<token>/travelplanner/<id>`）は同じ。

### 変わらないこと

- **DB スキーマ・データは一切変えない**（マイグレーションなし）。既存のグループ・トークン・URL はそのまま使える。
- `/api/upload`・`/api/cache-image`・`/api/delete` は従来どおり（`validateGroupToken` は中身を `resolveGroupId` に置き換えただけで、返り値は同じ）。`/api/delete` は PR #38 で自前の所有確認を入れている。
- 管理画面（`/api/admin/graphql`）は admin のまま。
- `anonymous` など、ほかのロールの permission には触らない（§6）。

### リポジトリのメタデータと本番のずれ（重要）

> **2026-10-18 追記**: 本番のメタデータを export して `hasura-project/metadata` に取り込み、`travel-planner/` と `travel-planner-prd/` は削除した。いまのリポジトリのメタデータは本番と同じ（`playing_with_neon` だけ除外）で、`group_member` の permission も本番と一致している。詳細は [hasura-project/README.md](../hasura-project/README.md)。それでも本番に `hasura metadata apply` はしない方針は変わらない。以下は取り込み前の状況の記録。

`hasura-project/metadata` は本番と一致していない。

- `databases.yaml` には `default`（ローカル用）しか無い。`travel-planner-prd/` はどこからも参照されていない。
- `travel-planner-prd/tables/*.yaml` には、本番で使っているリレーション（`itineraries.group` など）が無い。`GetItineraryByTokenAndId` が本番で動いているので、本番はコンソールで直接変更されていると考えられる。

そのため **本番に `hasura metadata apply` をしてはいけない**（リポジトリの内容で本番のメタデータが置き換わり、リレーション等が消える）。本番への適用は、本番の今のメタデータを読んで差分だけを足す `group-member-permissions.mjs` で行う。`travel-planner-prd/` の yaml は今回は触っていない（参照されておらず、触ると「これが本番」と誤解されるため）。

## 5. 適用手順（後藤さんの承認後に実施）

順番が大事。**Hasura（追加のみ・無害）→ アプリ** の順に入れる。逆にすると、新しいアプリが `group_member` で転送したときに権限が無く、全画面がエラーになる。

### 前提

- PR #38 がマージ済みであること（この PR は #38 のブランチの上に積んでいる）。
- Node.js 18 以上（スクリプトは標準の `fetch` を使う）。

### 手順

1. **計画を見る（読み取りのみ）**

   ```bash
   export HASURA_ENDPOINT="https://<本番の Hasura>.hasura.app"
   export HASURA_ADMIN_SECRET="<本番の admin secret>"
   node hasura-project/scripts/group-member-permissions.mjs plan
   ```

   - 「実行する操作」に `pg_create_*_permission`（18件）と、本番に無いリレーションの `pg_create_object_relationship` が並ぶことを確認する。
   - データソースが複数あってエラーになったら `--source <名前>` を付ける。
   - 「注意」に `anonymous` の権限が出たら §6 を参照。

2. **Hasura に適用する**

   ```bash
   node hasura-project/scripts/group-member-permissions.mjs apply
   ```

   - 実行前のメタデータが `hasura-project/backups/metadata-<日時>.json` に保存される（git 管理外）。
   - 追加のみなので、**いま動いている本番アプリには影響しない**（今のアプリは admin のまま転送しているため、`group_member` の権限を使わない）。
   - 何度実行しても同じ結果になる（既にある `group_member` の権限は作り直す）。
   - 操作は metadata API の `bulk` 1回で送る。途中の1件が失敗すると全体が適用されない（ローカルで確認済み）ので、中途半端な状態は残らない。

3. **デプロイプレビューで確認する**（PR の「動作確認」のチェックリスト）
   - プレビューの環境変数が本番 Hasura を指している場合、手順2より前だとプレビューでしおりが開けない。

4. **PR をマージして本番にデプロイ**

5. **本番で確認**
   - `/group/new` から新規作成 → プラン画面が開く。
   - 既存のしおり（作成済みのURL）でアクティビティ・予算・予約情報の追加・編集・削除ができる。
   - 他グループの旅程 id を URL に入れると「旅行プランが見つかりませんでした」になる。

## 6. ロールバック

| 状況 | 戻し方 |
| --- | --- |
| アプリに問題（画面が開けない等） | Netlify で直前のデプロイを Publish し直す。旧アプリは admin で転送するので、Hasura の permission が入ったままでも動く |
| Hasura の permission だけ外したい | **先にアプリを戻してから**、`node hasura-project/scripts/group-member-permissions.mjs rollback`。`group_member` の permission をすべて外す（追加したリレーションは残す。残っても害は無い） |
| メタデータを適用前に丸ごと戻したい | `node hasura-project/scripts/group-member-permissions.mjs restore hasura-project/backups/metadata-<日時>.json`。現在のメタデータを退避してから `replace_metadata` で戻す。適用後にコンソールで別の変更をしていたらそれも消えるので、通常は `rollback` を使う |

- **新しいアプリが動いている間に Hasura 側だけ戻してはいけない**（全画面が権限エラーになる）。
- DB のデータは変えていないので、データの復旧作業は無い。新しいアプリで作られたグループも、旧アプリでそのまま使える。

## 7. 確認したこと（ローカル）

使い捨ての Postgres + Hasura v2.46.0（Docker）に `default` のマイグレーションとメタデータを入れ、本番に近づけるため `activities.itinerary` / `budgets.itinerary` のリレーションを消した状態からスクリプトを適用して確認した。本番の Hasura には一切触っていない。

- スクリプト: `plan` → `apply`（リレーション2件 + permission 18件）→ もう一度 `plan` で作り直しになる（冪等）→ `rollback` で 0件 → `restore` で適用前に戻る → 再 `apply`。admin secret が違うと 401 で止まる
- グループ A のトークンで、アプリの全 GraphQL 操作（`src/graphql/*.ts` のうち画面から使っているもの）が通る
- グループ A のトークンで、グループ B の旅程・アクティビティ・予算・予約情報・ファイルの読み取り／insert／update／delete がすべて拒否される。リレーション経由（`activities { itinerary { group { token } } }`）でも見えない
- `activity.itinerary_id` や `itinerary.group_id` を付け替えて他グループへ移すことはできない。予算に他グループのアクティビティを紐づけることもできない
- `insert_groups` / `insert_itineraries` / `delete_groups` / `users` はエラー
- `/api/graphql`: トークン無し 401、無効トークン 403、クライアントが `x-hasura-role: admin` や `x-hasura-group-id` を付けても無視される
- `/api/groups`: 正常系 201（トークン32桁）、日付の逆転・存在しない日付・空の名前・不正な location_type・配列の destination・不正な JSON は 400
- ブラウザ: `/group/new` から作成 → プラン画面、予算タブ、情報タブが表示される。他グループの旅程 id を開くと「見つかりませんでした」

## 8. 今回の範囲外（別対応）

- **`anonymous` ロールの権限**（2026-10-25: 本番で実害なしを確認。権限の定義は残っている）: メタデータの `documents` / `travel_documents` / `document_files` には、`anonymous` ロールの条件なしの権限（select / insert / delete など）が定義されている。本番 Hasura は `HASURA_GRAPHQL_UNAUTHORIZED_ROLE` を設定していないため、admin secret の無いリクエストはすべて `access-denied` で拒否され、この権限は使われない。アプリも `anonymous` を使っていない。ただし今後 `HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous` を設定すると、その時点で全グループのデータが誰でも読み書きできるようになる。設定する予定は無いが、事故を防ぐためにメタデータから外すのが望ましい。
- **`hasura-project/config-production.yaml` に本番の admin secret が平文でコミットされていた**。（2026-10-18: ファイルから削除済み。2026-10-25: ローテーション済みを確認。git 履歴に残っている古い値は無効）
- **本番メタデータのリポジトリへの取り込み**: 本番を `hasura metadata export` して `travel-planner-prd/` を実態に合わせ、`databases.yaml` との関係も整理する。（2026-10-18: 対応済み。`hasura-project/README.md`）
- **使われていないコード**: `src/app/group/[token]/travelplanner/[travelPlannerId]/page.tsx` の新規作成用の分岐（`insertGroup` / `insertItinerary` を呼ぶ `useEffect`）は、このルートでは `travelPlannerId` が必ずあるため実行されない。今後この経路を使うと権限エラーになるので、削除してよい。`src/app/group/[token]/travelplanner/new/page.tsx` の `GET_GROUP`（`group_by_pk`）は必須の変数 `$id` を渡しておらず、もともと動いていない。
- **レート制限**: インメモリのため、Netlify の関数インスタンスごとに別カウントになる。`/api/groups` の連打対策としては弱い。
