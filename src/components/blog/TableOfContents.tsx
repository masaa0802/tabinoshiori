import type { TocItem } from "@/lib/microcms/toc";

/**
 * 記事冒頭の目次。h2 に番号を振り、その下の h3 を入れ子で並べる。
 *
 * 開閉は `<details>` に任せている。JavaScript なしで動き、
 * 閉じた状態でもページ内検索や読み上げから中身に届く。
 */
type TableOfContentsProps = {
  items: TocItem[];
};

/** h2 がこれより少ない記事には出さない。短い記事に目次があっても邪魔になる */
const MIN_SECTIONS = 2;

type Section = {
  item: TocItem;
  children: TocItem[];
};

function toSections(items: TocItem[]): Section[] {
  const sections: Section[] = [];
  for (const item of items) {
    if (item.level === 2) {
      sections.push({ item, children: [] });
    } else {
      // 最初の h2 より前にある h3 は、ぶら下げる先が無いので目次に出さない
      sections[sections.length - 1]?.children.push(item);
    }
  }
  return sections;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const sections = toSections(items);
  if (sections.length < MIN_SECTIONS) return null;

  return (
    <nav aria-label="目次" className="mt-8 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:px-6">
      <details open className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-bold text-gray-900">目次</span>
          <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500">
            <span className="group-open:hidden">開く</span>
            <span className="hidden group-open:inline">閉じる</span>
          </span>
        </summary>

        <ol className="mt-3 space-y-2.5 border-t border-gray-100 pt-4">
          {sections.map((section, index) => (
            <li key={section.item.id} className="flex gap-3 text-sm leading-relaxed">
              <span className="w-5 flex-shrink-0 pt-px font-semibold tabular-nums text-emerald-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <a
                  href={`#${section.item.id}`}
                  className="font-medium text-gray-800 hover:text-emerald-700"
                >
                  {section.item.text}
                </a>
                {section.children.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {section.children.map((child) => (
                      <li key={child.id} className="flex gap-2 text-[13px]">
                        <span aria-hidden="true" className="text-gray-300">
                          ・
                        </span>
                        <a href={`#${child.id}`} className="text-gray-600 hover:text-emerald-700">
                          {child.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
};

export default TableOfContents;
