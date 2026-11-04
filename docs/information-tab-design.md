# 情報タブ機能 設計書

## 1. 機能概要

### 目的
旅行に必要な航空券、ホテル予約、レンタカー、保険などの情報をPDF・画像ファイルでアップロードし、グループメンバー全員で共有・閲覧できる機能。

### 主要機能
- ファイルアップロード（PDF、画像）
- カテゴリー別整理
- ブラウザ内プレビュー（ダウンロード不要）
- 編集・削除機能
- グループメンバー間での共有

---

## 2. UI/UX設計

### 2.1 タブナビゲーション
既存のタブに「情報」を追加：
- 旅行プラン
- マップ
- 予算
- **情報** ← 新規追加

### 2.2 メイン画面レイアウト

```
┌─────────────────────────────────┐
│ 情報                             │
├─────────────────────────────────┤
│ [+ 情報を追加]                   │
│                                 │
│ ┌─ カテゴリーフィルター ────┐   │
│ │ すべて │ ✈️ │ 🏨 │ 🚗 │ 📋 │   │
│ └───────────────────────────┘   │
│                                 │
│ ✈️ 航空券                        │
│ ┌─────────────────────────┐     │
│ │ ANA123便                │     │
│ │ 2024/12/25 10:00-12:00  │     │
│ │ 成田 → 那覇             │     │
│ │ 予約番号: ABC123        │     │
│ │ 📎 eticket.pdf          │     │
│ └─────────────────────────┘     │
│                                 │
│ 🏨 ホテル                        │
│ ┌─────────────────────────┐     │
│ │ リゾートホテル沖縄       │     │
│ │ 12/25 - 12/27 (2泊)     │     │
│ │ 予約番号: HOTEL456      │     │
│ │ 📎 booking.pdf, room.jpg │     │
│ └─────────────────────────┘     │
└─────────────────────────────────┘
```

### 2.3 詳細表示モーダル（PDF）

```
┌─────────────────────────────────┐
│ × ANA123便                       │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   PDFビューアー          │   │
│  │   （航空券の内容）        │   │
│  │                         │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ページ: 1 / 2  [< >]           │
│                                 │
├─────────────────────────────────┤
│ [📥 ダウンロード] [🗑️ 削除]     │
└─────────────────────────────────┘
```

### 2.4 詳細表示モーダル（画像）

```
┌─────────────────────────────────┐
│ × リゾートホテル沖縄 (2/3)       │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   画像フルスクリーン      │   │
│  │   （ピンチズーム対応）    │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  < ○ ● ○ >  (スワイプ切替)     │
│                                 │
├─────────────────────────────────┤
│ [📥 ダウンロード] [🗑️ 削除]     │
└─────────────────────────────────┘
```

### 2.5 追加モーダル

```
┌─────────────────────────────────┐
│ × 情報を追加                     │
├─────────────────────────────────┤
│ タイトル                        │
│ ┌─────────────────────────┐     │
│ │ ANA123便                │     │
│ └─────────────────────────┘     │
│                                 │
│ カテゴリー                      │
│ ┌─────────────────────────┐     │
│ │ ✈️ 航空券 ▼             │     │
│ └─────────────────────────┘     │
│                                 │
│ 日時（オプション）               │
│ ┌───────┐ ┌─────┐             │
│ │12/25  │ │10:00│             │
│ └───────┘ └─────┘             │
│                                 │
│ 予約番号（オプション）           │
│ ┌─────────────────────────┐     │
│ │ ABC123                  │     │
│ └─────────────────────────┘     │
│                                 │
│ メモ（オプション）               │
│ ┌─────────────────────────┐     │
│ │                         │     │
│ └─────────────────────────┘     │
│                                 │
│ ファイル                        │
│ ┌─────────────────────────┐     │
│ │  ドラッグ&ドロップ       │     │
│ │  または                 │     │
│ │  [📁 ファイルを選択]     │     │
│ └─────────────────────────┘     │
│                                 │
│ ✓ eticket.pdf (1.2MB)           │
│                                 │
├─────────────────────────────────┤
│      [キャンセル]  [保存]        │
└─────────────────────────────────┘
```

### 2.6 カテゴリー

| アイコン | カテゴリー名 | 用途 |
|---------|------------|------|
| ✈️ | 航空券 | フライト情報、eチケット |
| 🏨 | ホテル | 宿泊予約確認書 |
| 🚗 | レンタカー | レンタカー予約 |
| 🚆 | 交通機関 | 新幹線、バスチケット |
| 📋 | 保険 | 旅行保険証書 |
| 📞 | 緊急連絡先 | 大使館、病院情報 |
| 🎫 | チケット | 観光施設、イベント |
| 📄 | その他 | ビザ、パスポートコピーなど |

### 2.7 モバイル対応
- スワイプで編集・削除ボタン表示（アクティビティと同様）
- カード形式で表示
- タップでモーダル表示
- ピンチズーム対応（画像）

---

## 3. データベース設計

### 3.1 新規テーブル: `travel_documents`

```sql
CREATE TABLE travel_documents (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date TIMESTAMP,
  reservation_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_travel_documents_itinerary_id ON travel_documents(itinerary_id);
CREATE INDEX idx_travel_documents_category ON travel_documents(category);
```

### 3.2 新規テーブル: `document_files`

```sql
CREATE TABLE document_files (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES travel_documents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'pdf', 'image'
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER, -- バイト単位
  mime_type VARCHAR(100),
  cloudinary_public_id VARCHAR(255), -- Cloudinaryの管理ID
  display_order INTEGER DEFAULT 0, -- 複数ファイルの表示順
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_document_files_document_id ON document_files(document_id);
```

### 3.3 リレーション

```
itineraries (既存)
    ↓ 1:N
travel_documents (新規)
    ↓ 1:N
document_files (新規)
```

---

### 3.4 アクティビティとの紐づけ（2026-11 追加）

情報（`travel_documents`）を旅程のアクティビティ1件に紐づけられる。マイグレーションは `hasura-project/migrations/default/9_add_activity_id_to_travel_documents`。

```sql
ALTER TABLE travel_documents
  ADD COLUMN IF NOT EXISTS activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_travel_documents_activity_id ON travel_documents(activity_id);
```

- 紐づけは任意。既存の情報は `activity_id = NULL`（紐づけなし）のまま変わらない。
- アクティビティを削除しても情報とファイルは消えず、紐づけだけが外れる（予算の `activity_id` と同じ）。
- 紐づけられるのは同じ旅程のアクティビティだけ。Hasura の `group_member` の insert / update の check で強制している（`activity.itinerary_id` を `["$", "itinerary_id"]` と比較）。
- 画面
  - 情報の追加・編集に「関連する予定」を選ぶ欄がある。日付が未選択なら予定の日付が入る。
  - 情報タブのカードとビューアーに、紐づいた予定（「10:00 那覇空港」）を出す。
  - アクティビティの詳細画面に「この予定のファイル」を出す。その下に、同じ日付でまだどの予定にも紐づいていない情報を「同じ日の情報」として出す（紐づけ機能より前に登録したものを見失わないため）。
  - アクティビティの詳細画面や、アクティビティ追加時に添付したファイルは、その予定に紐づけて保存する。

## 4. ファイルアップロード設計

### 4.1 Cloudinary設定

**環境変数**（`.env.local`）:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**アップロード設定**:
- 対応フォーマット: PDF, JPG, PNG
- 最大ファイルサイズ: 10MB
- フォルダ構造: `travel-planner/{itinerary_id}/documents/`
- 自動最適化: 画像のみ

### 4.2 アップロードフロー

```
1. ユーザーがファイル選択
   ↓
2. フロントエンドでバリデーション
   - ファイルサイズチェック
   - ファイル形式チェック
   ↓
3. Cloudinaryへ直接アップロード
   - unsigned upload または signed upload
   ↓
4. アップロード完了後、URLを取得
   ↓
5. GraphQL mutation でDBに保存
   - document作成
   - file情報保存
```

### 4.3 ファイル管理

**保存される情報**:
- `file_url`: Cloudinary URL（https://res.cloudinary.com/...）
- `cloudinary_public_id`: 削除時に使用
- `file_type`: プレビュー表示の判定に使用
- `mime_type`: ブラウザ表示用

**削除時の処理**:
1. DBからレコード削除（CASCADE）
2. Cloudinary APIでファイル削除

---

## 5. 技術スタック

### 5.1 フロントエンド
- **ファイルアップロード**: `react-dropzone`
- **PDFビューアー**: `react-pdf` または `<iframe>`
- **画像ビューアー**: カスタムモーダル + ピンチズーム
- **Cloudinary SDK**: `cloudinary-react` または直接API呼び出し

### 5.2 バックエンド
- **Hasura**: GraphQL mutations/queries
- **Cloudinary**: ファイルストレージ・CDN

### 5.3 依存パッケージ（追加）

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",
    "react-pdf": "^7.7.0",
    "cloudinary": "^2.0.0"
  }
}
```

---

## 6. GraphQL API設計

### 6.1 Queries

```graphql
# 全ドキュメント取得
query GetTravelDocuments($itinerary_id: Int!) {
  travel_documents(
    where: { itinerary_id: { _eq: $itinerary_id } }
    order_by: { created_at: desc }
  ) {
    id
    title
    category
    date
    reservation_number
    notes
    created_at
    files: document_files(order_by: { display_order: asc }) {
      id
      file_url
      file_type
      file_name
      file_size
      mime_type
      display_order
    }
  }
}

# カテゴリー別取得
query GetDocumentsByCategory($itinerary_id: Int!, $category: String!) {
  travel_documents(
    where: {
      itinerary_id: { _eq: $itinerary_id }
      category: { _eq: $category }
    }
    order_by: { date: asc }
  ) {
    id
    title
    category
    date
    reservation_number
    notes
    files: document_files(order_by: { display_order: asc }) {
      id
      file_url
      file_type
      file_name
      file_size
    }
  }
}

# 単一ドキュメント取得
query GetTravelDocument($id: Int!) {
  travel_documents_by_pk(id: $id) {
    id
    title
    category
    date
    reservation_number
    notes
    created_at
    files: document_files(order_by: { display_order: asc }) {
      id
      file_url
      file_type
      file_name
      file_size
      mime_type
      cloudinary_public_id
      display_order
    }
  }
}
```

### 6.2 Mutations

```graphql
# ドキュメント作成
mutation InsertTravelDocument(
  $itinerary_id: Int!
  $title: String!
  $category: String!
  $date: timestamp
  $reservation_number: String
  $notes: String
  $files: [document_files_insert_input!]!
) {
  insert_travel_documents_one(
    object: {
      itinerary_id: $itinerary_id
      title: $title
      category: $category
      date: $date
      reservation_number: $reservation_number
      notes: $notes
      files: { data: $files }
    }
  ) {
    id
    title
    files {
      id
      file_url
      file_type
      file_name
    }
  }
}

# ドキュメント更新
mutation UpdateTravelDocument(
  $id: Int!
  $title: String
  $category: String
  $date: timestamp
  $reservation_number: String
  $notes: String
) {
  update_travel_documents_by_pk(
    pk_columns: { id: $id }
    _set: {
      title: $title
      category: $category
      date: $date
      reservation_number: $reservation_number
      notes: $notes
      updated_at: "now()"
    }
  ) {
    id
    title
    updated_at
  }
}

# ファイル追加
mutation InsertDocumentFile(
  $document_id: Int!
  $file_url: String!
  $file_type: String!
  $file_name: String!
  $file_size: Int
  $mime_type: String
  $cloudinary_public_id: String
  $display_order: Int
) {
  insert_document_files_one(
    object: {
      document_id: $document_id
      file_url: $file_url
      file_type: $file_type
      file_name: $file_name
      file_size: $file_size
      mime_type: $mime_type
      cloudinary_public_id: $cloudinary_public_id
      display_order: $display_order
    }
  ) {
    id
    file_url
    file_name
  }
}

# ファイル削除
mutation DeleteDocumentFile($id: Int!) {
  delete_document_files_by_pk(id: $id) {
    id
    cloudinary_public_id
  }
}

# ドキュメント削除
mutation DeleteTravelDocument($id: Int!) {
  delete_travel_documents_by_pk(id: $id) {
    id
    files {
      cloudinary_public_id
    }
  }
}
```

---

## 7. 実装手順

### Phase 1: データベース準備
1. ✅ マイグレーションファイル作成
   - `travel_documents` テーブル
   - `document_files` テーブル
2. ✅ Hasuraでテーブル追跡
3. ✅ リレーション設定
4. ✅ パーミッション設定

### Phase 2: GraphQL API
1. ✅ queries.tsに追加
   - `GET_TRAVEL_DOCUMENTS`
   - `GET_TRAVEL_DOCUMENT`
2. ✅ mutates.tsに追加
   - `INSERT_TRAVEL_DOCUMENT`
   - `UPDATE_TRAVEL_DOCUMENT`
   - `DELETE_TRAVEL_DOCUMENT`
   - `INSERT_DOCUMENT_FILE`
   - `DELETE_DOCUMENT_FILE`

### Phase 3: Cloudinary設定
1. ✅ Cloudinaryアカウント作成
2. ✅ 環境変数設定
3. ✅ アップロードプリセット設定
4. ✅ アップロードヘルパー関数作成

### Phase 4: コンポーネント実装
1. ✅ `InformationContent.tsx` - メイン画面
2. ✅ `AddDocumentModal.tsx` - 追加モーダル
3. ✅ `DocumentCard.tsx` - ドキュメントカード
4. ✅ `DocumentViewerModal.tsx` - PDF/画像ビューアー
5. ✅ `FileUploader.tsx` - ファイルアップロードコンポーネント

### Phase 5: 統合
1. ✅ タブナビゲーションに「情報」追加
2. ✅ ルーティング設定
3. ✅ スワイプ機能実装
4. ✅ エラーハンドリング

### Phase 6: テスト・調整
1. ✅ モバイル表示確認
2. ✅ PDFプレビュー動作確認
3. ✅ ファイルアップロード・削除確認
4. ✅ パフォーマンス最適化

---

## 8. セキュリティ考慮事項

### 8.1 ファイルアップロード
- ファイルサイズ制限: 10MB
- 許可する拡張子: `.pdf`, `.jpg`, `.jpeg`, `.png`
- MIMEタイプ検証
- ウイルススキャン（本番環境では検討）

### 8.2 アクセス制御
- itinerary_idによる権限チェック
- グループメンバーのみアクセス可能
- Hasuraのパーミッション設定

### 8.3 個人情報保護
- パスポート情報などの取り扱い注意
- 予約番号のマスキング検討
- HTTPS通信必須

---

## 9. 将来の拡張案

### 9.1 機能拡張
- OCR機能（予約番号の自動抽出）
- カレンダー連携
- リマインダー通知
- QRコード生成（空港チェックイン用）
- オフライン対応

### 9.2 UI改善
- ダークモード対応
- ドラッグ&ドロップ並び替え
- 一括ダウンロード（ZIP）
- 印刷レイアウト最適化

---

## 10. 参考資料

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [react-dropzone](https://react-dropzone.js.org/)
- [react-pdf](https://github.com/wojtekmaj/react-pdf)
- [Hasura Permissions](https://hasura.io/docs/latest/auth/authorization/permissions/)

---

**作成日**: 2026-01-10
**最終更新**: 2026-01-10
**ステータス**: 設計完了 → 実装待ち
