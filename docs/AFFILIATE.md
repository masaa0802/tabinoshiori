# 宿の予約アフィリエイト

しおりの行程から宿の予約サイトへ送客し、成果報酬を得る仕組み。

## 表示する場所

| 場所 | 条件 | `trip_sub1` / GA の `placement` |
|---|---|---|
| プランタブの日ごとのタイムライン末尾 | 最終日以外で、その日に「宿」の予定が無い | `day_hotel_gap` |
| 予定の詳細シート | 種別が「宿」で、費用もファイルもまだ登録されていない（＝未予約らしい） | `activity_sheet` |
| 宿を追加した直後のカード | 種別「宿」を追加し、予約確認のファイルを添付しなかった | `activity_added` |

- 検索キーワードは、日ごとの導線では行き先（複数あれば最初の1つ）、詳細シートでは宿の名前
- チェックインはその日、チェックアウトは翌日
- 並び順は、海外旅行なら Trip.com が先頭、国内旅行なら国内の予約サイトが先

## 予約後に情報タブへ記録する流れ

アフィリエイトでは「誰が何を予約したか」は返ってこず、Trip.com にもユーザーの予約を読むAPIは無い。
そこで、予約ボタンを押した時にブラウザ（localStorage の `shiori_pending_booking`）へ「どのしおりの、どの宿を、いつで探したか」を残し、
しおりのタブに戻ってきた時（15秒以上経過、24時間以内）に「◯◯で予約できましたか？」と聞く（`BookingReturnPrompt`）。

- 「予約した」のワンタップで、宿名・宿泊日・予約サイト名の入った情報を情報タブの「ホテル」に作る（入力は不要）
- 予約番号や確認画面は、必要な人だけ情報タブの編集で後から足す
- 宿の予定から来た場合は、その予定に紐づける
- ファイル無しの情報も扱えるよう、情報タブの表示・編集を対応させた（予約番号があれば大きく表示）
- GA4: `affiliate_return`（`result`: booked / not_yet）、`affiliate_booking_recorded`

## 設定（環境変数）

`.env.local.example` を参照。値はリンクに出る公開値なので `NEXT_PUBLIC_` で渡し、Netlify の環境変数に入れて再デプロイする。
未設定の提携先はボタンを出さない。全部未設定なら導線ごと出ない。

## リンク形式

実装は `src/lib/affiliate.ts` に集約している。

- Trip.com: `https://jp.trip.com/hotels/list?keyword=…&checkin=…&checkout=…&Allianceid=…&SID=…&trip_sub1=<placement>`
- バリューコマース（MyLink）: `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=…&pid=…&vc_url=<遷移先URL>`

各予約サイトの検索URL（遷移先）は、管理画面で発行したサンプルリンクで動作を確かめてから使うこと。

## 表記（ステマ規制）

2023年10月施行の景品表示法の告示（いわゆるステマ規制）に沿って、ボタンの下に「PR」と紹介料が発生しうる旨を出す。
リンクには `rel="sponsored noopener noreferrer"` を付ける。プライバシーポリシー第9条にもアフィリエイトへの参加を記載した。

## 計測

クリック時に GA4 イベント `affiliate_click`（`provider`, `placement`, `trip_type`）を送る。
成果（予約数・報酬）は各ASPの管理画面で `trip_sub1` 別に確認する。
