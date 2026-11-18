import Link from "next/link";

type AreaBreadcrumbsProps = {
  items: { name: string; path: string }[];
};

/** 地図から探すページのパンくず。最後の項目は今いるページなのでリンクにしない */
const AreaBreadcrumbs: React.FC<AreaBreadcrumbsProps> = ({ items }) => (
  <nav aria-label="パンくずリスト" className="text-xs text-ink-muted">
    <ol className="flex flex-wrap items-center gap-1.5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.path} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="text-ink" aria-current="page">
                {item.name}
              </span>
            ) : (
              <>
                <Link href={item.path} className="underline decoration-rule underline-offset-[3px] hover:text-shu">
                  {item.name}
                </Link>
                <span aria-hidden="true">/</span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default AreaBreadcrumbs;
