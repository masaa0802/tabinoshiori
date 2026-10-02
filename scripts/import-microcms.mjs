#!/usr/bin/env node
/**
 * microCMS へシードデータを投入する。
 *
 * CSVインポートの代わりに使う。CSVでは扱えない参照フィールド（category / spots）と
 * セレクトフィールド（tags）もまとめて設定できるので、記事を1件ずつ開いて
 * 手で直す作業がなくなる。
 *
 * 実行にはオーナーのAPIキー（書き込み権限つき）が必要。
 * **キーは環境変数から読む。このファイルにもコマンドラインにも書かないこと。**
 *
 *   export MICROCMS_SERVICE_DOMAIN=lisczn7nn1
 *   export MICROCMS_API_KEY=<書き込み権限のあるキー>
 *
 *   node scripts/import-microcms.mjs            # 何が送られるか表示するだけ
 *   node scripts/import-microcms.mjs --apply    # 実際に送る（下書きとして作成）
 *   node scripts/import-microcms.mjs --apply --publish   # 公開状態で作成
 *
 * 既定が下書きなのは、シードデータが動作確認用のサンプルだから。
 * とくに cheap-flight-timing の金額はレイアウト確認用の仮の値で、
 * 調査した事実ではない。公開する前に実際の数値と出典へ差し替えること。
 *
 * contentId を指定した PUT なので、同じIDで再実行すると上書きになる。
 * 途中で失敗しても、直してもう一度流せばよい。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SEED_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "microcms",
  "seed-csv"
);

/** CSVで表現できない参照フィールド。記事のコンテンツIDで引く */
const ARTICLE_REFERENCES = {
  "kyoto-2days-guide": {
    category: "model-course",
    spots: ["kiyomizu-dera", "fushimi-inari", "nishiki-market"],
  },
  "first-overseas-packing-list": { category: "preparation", spots: [] },
  "cheap-flight-timing": { category: "preparation", spots: [] },
  "taipei-travel-guide": {
    category: "destination-guide",
    spots: ["taipei-101", "shilin-night-market"],
  },
};

/**
 * RFC4180 のCSVを読む。本文(body)に改行入りのHTMLが入っているため、
 * 引用符で囲まれた改行とエスケープされた引用符("")を正しく扱う必要がある。
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; }
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") { field += c; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim() !== ""));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function readSeed(name) {
  return parseCsv(fs.readFileSync(path.join(SEED_DIR, `${name}.csv`), "utf-8"));
}

/** 空文字をフィールドごと落とす。未設定と空文字を microCMS 側で区別するため */
function omitEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) =>
      v !== "" && v !== undefined && !(Array.isArray(v) && v.length === 0)
    )
  );
}

function splitList(value) {
  return (value ?? "")
    .split(/[,、\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toNumber(value) {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildPayloads() {
  const categories = readSeed("categories").map((r) => ({
    contentId: r.contentId,
    body: omitEmpty({
      name: r.name,
      slug: r.slug,
      description: r.description,
      order: toNumber(r.order),
    }),
  }));

  const spots = readSeed("spots").map((r) => ({
    contentId: r.contentId,
    body: omitEmpty({
      name: r.name,
      description: r.description,
      address: r.address,
      activityType: r.activityType,
      lat: toNumber(r.lat),
      lng: toNumber(r.lng),
    }),
  }));

  const articles = readSeed("articles").map((r) => {
    const refs = ARTICLE_REFERENCES[r.contentId];
    if (!refs) {
      throw new Error(
        `参照先が未定義の記事があります: ${r.contentId}\n` +
          `scripts/import-microcms.js の ARTICLE_REFERENCES に追記してください。`
      );
    }
    return {
      contentId: r.contentId,
      body: omitEmpty({
        title: r.title,
        excerpt: r.excerpt,
        body: r.body,
        // 参照フィールドはコンテンツIDで指定する
        category: refs.category,
        spots: refs.spots,
        // セレクトフィールドは配列
        tags: splitList(r.tags),
        freeTags: r.freeTags,
        destination: r.destination,
        seoDescription: r.seoDescription,
        featured: r.featured?.toLowerCase() === "true",
        priceCheckedAt: r.priceCheckedAt,
        priceSources: r.priceSources,
      }),
    };
  });

  // 参照される側を先に入れる
  return [
    { endpoint: "categories", items: categories },
    { endpoint: "spots", items: spots },
    { endpoint: "articles", items: articles },
  ];
}

async function put(domain, apiKey, endpoint, contentId, body, draft) {
  const query = draft ? "?status=draft" : "";
  const res = await fetch(
    `https://${domain}.microcms.io/api/v1/${endpoint}/${contentId}${query}`,
    {
      method: "PUT",
      headers: { "X-MICROCMS-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const apply = process.argv.includes("--apply");
  const draft = !process.argv.includes("--publish");
  const groups = buildPayloads();

  if (!apply) {
    console.log("=== ドライラン（何も送信しません）===\n");
    for (const { endpoint, items } of groups) {
      console.log(`${endpoint}: ${items.length}件`);
      for (const item of items) {
        const keys = Object.keys(item.body).join(", ");
        console.log(`   ${item.contentId}`);
        console.log(`      ${keys}`);
      }
      console.log();
    }
    console.log("実際に送るには --apply を付けてください。");
    console.log(`状態: ${draft ? "下書き" : "公開"}（--publish で公開）`);
    return;
  }

  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!domain || !apiKey) {
    console.error(
      "MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を環境変数に設定してください。\n" +
        "APIキーは書き込み権限（PUT）が必要です。"
    );
    process.exit(1);
  }

  console.log(`送信先: ${domain}.microcms.io`);
  console.log(`状態: ${draft ? "下書き" : "公開"}\n`);

  let failed = 0;
  for (const { endpoint, items } of groups) {
    console.log(`=== ${endpoint} ===`);
    for (const item of items) {
      try {
        await put(domain, apiKey, endpoint, item.contentId, item.body, draft);
        console.log(`   OK   ${item.contentId}`);
      } catch (error) {
        failed++;
        console.error(`   NG   ${item.contentId}`);
        console.error(`        ${error.message}`);
      }
    }
    console.log();
  }

  if (failed > 0) {
    console.error(`${failed}件が失敗しました。上のエラーを確認してください。`);
    process.exit(1);
  }
  console.log("すべて完了しました。");
  if (draft) {
    console.log("下書きとして作成しています。管理画面で内容を確認してから公開してください。");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
