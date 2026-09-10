import {
  formatYearMonth,
  isPriceStale,
  PRICE_STALE_AFTER_MONTHS,
} from "@/lib/microcms/format";

/**
 * 料金・相場を含む記事の冒頭に出す注釈バナー。
 *
 * 「金額は出すが、必ず調査時点と出典を添える」という編集方針を、
 * 個々の金額だけでなく記事単位でも明示するためのもの。
 * 調査から一定期間が過ぎた記事は警告色に変わり、棚卸しが必要なことが読者にも運営にも分かる。
 */
type PriceDisclosureProps = {
  /** ISO8601。未設定なら何も表示しない */
  checkedAt?: string;
  sources: string[];
};

const PriceDisclosure: React.FC<PriceDisclosureProps> = ({
  checkedAt,
  sources,
}) => {
  if (!checkedAt) return null;

  const stale = isPriceStale(checkedAt);
  const checkedAtLabel = formatYearMonth(checkedAt);

  return (
    <aside
      className={`mt-8 rounded-xl border p-4 text-xs leading-relaxed sm:text-sm ${
        stale
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <p className="font-semibold">
        {stale
          ? `この記事の料金は${checkedAtLabel}時点の情報です。${PRICE_STALE_AFTER_MONTHS}か月以上経過しているため、最新の価格をあわせてご確認ください。`
          : `この記事の料金・相場は${checkedAtLabel}時点の情報です。`}
      </p>
      <p className="mt-1.5">
        航空券や宿泊費は時期・為替・空席状況で変動します。実際の予約前に各サービスの表示価格をご確認ください。
      </p>
      {sources.length > 0 && (
        <p className="mt-2">
          <span className="font-semibold">出典:</span> {sources.join(" / ")}
        </p>
      )}
    </aside>
  );
};

export default PriceDisclosure;
