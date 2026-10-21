#!/usr/bin/env node
/**
 * group_member ロールの permission を Hasura に足す／外すスクリプト。
 * 設計と本番での手順は docs/GROUP_SCOPED_ACCESS.md。
 *
 * 本番に `hasura metadata apply` でディレクトリごと流すと、リポジトリに取り込んだあとに
 * 本番で行われた変更を消してしまう（hasura-project/README.md）。
 * このスクリプトは本番の今のメタデータを読んで、足りないリレーションと
 * group_member の permission だけを metadata API で追加する。
 *
 * 使い方（どれも HASURA_ENDPOINT と HASURA_ADMIN_SECRET が必要）:
 *   node hasura-project/scripts/group-member-permissions.mjs plan              # 何が変わるかを表示するだけ（既定）
 *   node hasura-project/scripts/group-member-permissions.mjs apply             # バックアップを取ってから適用
 *   node hasura-project/scripts/group-member-permissions.mjs rollback          # group_member の permission を外す
 *   node hasura-project/scripts/group-member-permissions.mjs restore <file>    # バックアップのメタデータに丸ごと戻す
 *
 * オプション: --source <name>  対象のデータソース名（itineraries を持つソースが1つだけなら省略可）
 *
 * HASURA_ENDPOINT は https://xxx.hasura.app のようなベースURL（/v1/graphql が付いていても可）。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROLE = 'group_member';
const BACKUP_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backups');

// ---- permission の定義（hasura-project/metadata/databases/*/tables/*.yaml はこれの写し） ----

const OWN_GROUP = { _eq: 'X-Hasura-Group-Id' };
const OWN_ITINERARY = { itinerary: { group_id: OWN_GROUP } };
const OWN_TRAVEL_DOCUMENT = { travel_document: { itinerary: { group_id: OWN_GROUP } } };
// 予算に紐づけるアクティビティも自グループのものに限る（他グループのアクティビティ id を指させない）
const OWN_ACTIVITY_OR_NONE = {
  _or: [{ activity_id: { _is_null: true } }, { activity: OWN_ITINERARY }],
};

// insert / update の列は、いまアプリが送っている列だけに絞る（src/graphql/mutates.ts）。
// これらはアプリが本番で使えている列なので、本番に存在することが分かっている
const PERMISSIONS = {
  groups: {
    // groups の作成は /api/groups（admin）だけ。token は GetItineraryByTokenAndId の where で使う
    select: { columns: ['id', 'name', 'token', 'created_at', 'updated_at'], filter: { id: OWN_GROUP } },
  },
  itineraries: {
    // 旅程の作成は /api/groups（admin）だけ。group_id は付け替えられないよう update に含めない
    select: { columns: '*', filter: { group_id: OWN_GROUP } },
    update: {
      columns: ['title', 'destination', 'start_date', 'end_date', 'travel_purpose', 'location_type', 'total_budget'],
      filter: { group_id: OWN_GROUP },
      check: { group_id: OWN_GROUP },
    },
  },
  activities: {
    select: { columns: '*', filter: OWN_ITINERARY },
    insert: {
      columns: ['itinerary_id', 'name', 'location', 'notes', 'type', 'date', 'time', 'photo_url', 'lat', 'lng', 'place_id'],
      check: OWN_ITINERARY,
    },
    update: {
      columns: ['name', 'location', 'notes', 'type', 'date', 'time', 'photo_url', 'lat', 'lng', 'place_id'],
      filter: OWN_ITINERARY,
      check: OWN_ITINERARY,
    },
    delete: { filter: OWN_ITINERARY },
  },
  budgets: {
    select: { columns: '*', filter: OWN_ITINERARY },
    insert: {
      columns: ['itinerary_id', 'date', 'activity_id', 'category', 'amount', 'description', 'currency'],
      check: { _and: [OWN_ITINERARY, OWN_ACTIVITY_OR_NONE] },
    },
    update: {
      columns: ['date', 'activity_id', 'category', 'amount', 'description', 'currency'],
      filter: OWN_ITINERARY,
      check: { _and: [OWN_ITINERARY, OWN_ACTIVITY_OR_NONE] },
    },
    delete: { filter: OWN_ITINERARY },
  },
  travel_documents: {
    select: { columns: '*', filter: OWN_ITINERARY },
    insert: {
      columns: ['itinerary_id', 'title', 'category', 'date', 'reservation_number', 'notes'],
      check: OWN_ITINERARY,
    },
    update: {
      columns: ['title', 'category', 'date', 'reservation_number', 'notes', 'updated_at'],
      filter: OWN_ITINERARY,
      check: OWN_ITINERARY,
    },
    delete: { filter: OWN_ITINERARY },
  },
  document_files: {
    select: { columns: '*', filter: OWN_TRAVEL_DOCUMENT },
    insert: {
      columns: [
        'travel_document_id', 'file_url', 'file_type', 'file_name',
        'file_size', 'mime_type', 'cloudinary_public_id', 'display_order',
      ],
      check: OWN_TRAVEL_DOCUMENT,
    },
    delete: { filter: OWN_TRAVEL_DOCUMENT },
  },
};

// permission の filter / check がたどるリレーション（無ければ外部キーから作る）
const REQUIRED_RELATIONSHIPS = [
  { table: 'activities', name: 'itinerary', column: 'itinerary_id' },
  { table: 'budgets', name: 'itinerary', column: 'itinerary_id' },
  { table: 'budgets', name: 'activity', column: 'activity_id' },
  { table: 'travel_documents', name: 'itinerary', column: 'itinerary_id' },
  { table: 'document_files', name: 'travel_document', column: 'travel_document_id' },
  // /api/groups が旅程からグループをネストして作るのに使う
  { table: 'itineraries', name: 'group', column: 'group_id' },
];

const PERMISSION_TYPES = ['select', 'insert', 'update', 'delete'];

// ---- metadata API ----

function getEnv() {
  const rawEndpoint = process.env.HASURA_ENDPOINT;
  const secret = process.env.HASURA_ADMIN_SECRET;
  if (!rawEndpoint || !secret) {
    console.error('HASURA_ENDPOINT と HASURA_ADMIN_SECRET を環境変数で渡してください');
    process.exit(1);
  }
  const base = rawEndpoint.replace(/\/v1\/graphql\/?$/, '').replace(/\/$/, '');
  return { url: `${base}/v1/metadata`, secret, base };
}

async function metadataApi(env, body) {
  const res = await fetch(env.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': env.secret },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`metadata API エラー (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

async function exportMetadata(env) {
  return metadataApi(env, { type: 'export_metadata', args: {} });
}

async function saveBackup(metadata) {
  await mkdir(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `metadata-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(metadata, null, 2));
  return file;
}

// ---- 計画づくり ----

function pickSource(metadata, requested) {
  const sources = metadata.sources ?? [];
  if (requested) {
    const source = sources.find((s) => s.name === requested);
    if (!source) throw new Error(`データソース ${requested} が見つかりません（あるもの: ${sources.map((s) => s.name).join(', ')}）`);
    return source;
  }
  const candidates = sources.filter((s) => (s.tables ?? []).some((t) => t.table?.name === 'itineraries'));
  if (candidates.length !== 1) {
    throw new Error(
      `itineraries を持つデータソースが ${candidates.length} 個あります。--source で指定してください（${sources.map((s) => s.name).join(', ')}）`
    );
  }
  return candidates[0];
}

function findTable(source, name) {
  return (source.tables ?? []).find((t) => t.table?.schema === 'public' && t.table?.name === name);
}

function hasRelationship(tableMeta, name) {
  return [...(tableMeta.object_relationships ?? []), ...(tableMeta.array_relationships ?? [])].some(
    (r) => r.name === name
  );
}

function buildPlan(metadata, requestedSource) {
  const source = pickSource(metadata, requestedSource);
  const ops = [];
  const notes = [];

  for (const tableName of Object.keys(PERMISSIONS)) {
    if (!findTable(source, tableName)) {
      throw new Error(`テーブル public.${tableName} が ${source.name} で track されていません`);
    }
  }

  for (const rel of REQUIRED_RELATIONSHIPS) {
    const tableMeta = findTable(source, rel.table);
    if (!tableMeta) throw new Error(`テーブル public.${rel.table} が track されていません`);
    if (hasRelationship(tableMeta, rel.name)) continue;
    ops.push({
      type: 'pg_create_object_relationship',
      args: {
        source: source.name,
        table: { schema: 'public', name: rel.table },
        name: rel.name,
        using: { foreign_key_constraint_on: rel.column },
      },
    });
  }

  for (const [tableName, perms] of Object.entries(PERMISSIONS)) {
    const tableMeta = findTable(source, tableName);
    const table = { schema: 'public', name: tableName };

    // ほかのロールの permission は触らないが、存在は知らせる（anonymous など）
    for (const type of PERMISSION_TYPES) {
      for (const p of tableMeta[`${type}_permissions`] ?? []) {
        if (p.role !== ROLE) notes.push(`${tableName}: ロール ${p.role} に ${type} 権限があります（このスクリプトでは変更しません）`);
      }
    }

    for (const type of PERMISSION_TYPES) {
      const existing = (tableMeta[`${type}_permissions`] ?? []).some((p) => p.role === ROLE);
      // 何度流しても同じ結果になるよう、既にあるものは作り直す
      if (existing) {
        ops.push({ type: `pg_drop_${type}_permission`, args: { source: source.name, table, role: ROLE } });
      }
      if (perms[type]) {
        ops.push({
          type: `pg_create_${type}_permission`,
          args: { source: source.name, table, role: ROLE, permission: perms[type] },
        });
      }
    }
  }

  return { source: source.name, ops, notes };
}

function buildRollback(metadata, requestedSource) {
  const source = pickSource(metadata, requestedSource);
  const ops = [];
  for (const tableMeta of source.tables ?? []) {
    for (const type of PERMISSION_TYPES) {
      if ((tableMeta[`${type}_permissions`] ?? []).some((p) => p.role === ROLE)) {
        ops.push({
          type: `pg_drop_${type}_permission`,
          args: { source: source.name, table: tableMeta.table, role: ROLE },
        });
      }
    }
  }
  return { source: source.name, ops };
}

function describe(op) {
  const t = op.args.table ? `${op.args.table.schema}.${op.args.table.name}` : '';
  return `  - ${op.type} ${t}${op.args.name ? ` (${op.args.name})` : ''}`;
}

// ---- main ----

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'plan';
  const sourceIdx = args.indexOf('--source');
  const requestedSource = sourceIdx >= 0 ? args[sourceIdx + 1] : undefined;
  const env = getEnv();
  console.log(`対象: ${env.base}`);

  if (command === 'restore') {
    const file = args[1];
    if (!file) throw new Error('restore にはバックアップファイルのパスを渡してください');
    const backup = JSON.parse(await readFile(file, 'utf8'));
    const current = await exportMetadata(env);
    console.log(`現在のメタデータを退避: ${await saveBackup(current)}`);
    await metadataApi(env, { type: 'replace_metadata', args: backup });
    console.log(`${file} の内容に戻しました`);
    return;
  }

  const metadata = await exportMetadata(env);

  if (command === 'plan' || command === 'apply') {
    const { source, ops, notes } = buildPlan(metadata, requestedSource);
    console.log(`データソース: ${source}`);
    console.log(`実行する操作 (${ops.length} 件):`);
    ops.forEach((op) => console.log(describe(op)));
    if (notes.length) {
      console.log('\n注意:');
      notes.forEach((n) => console.log(`  - ${n}`));
    }
    if (command === 'plan') {
      console.log('\nplan のみ。適用するには apply を指定してください');
      return;
    }
    console.log(`\nバックアップ: ${await saveBackup(metadata)}`);
    await metadataApi(env, { type: 'bulk', args: ops });
    console.log('適用しました');
    return;
  }

  if (command === 'rollback') {
    const { source, ops } = buildRollback(metadata, requestedSource);
    console.log(`データソース: ${source}`);
    if (!ops.length) {
      console.log(`${ROLE} の permission はありません。何もしません`);
      return;
    }
    ops.forEach((op) => console.log(describe(op)));
    console.log(`\nバックアップ: ${await saveBackup(metadata)}`);
    await metadataApi(env, { type: 'bulk', args: ops });
    console.log(`${ROLE} の permission を外しました（追加したリレーションは残します）`);
    return;
  }

  throw new Error(`不明なコマンド: ${command}（plan / apply / rollback / restore）`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
