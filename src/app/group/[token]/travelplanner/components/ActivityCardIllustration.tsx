import Image from "next/image";
import { getActivityTypeImage } from "@/lib/activityTypeImage";

// 左端を透明にして白いカードへ溶け込ませる。文字は左寄せなので、重なる部分は薄くなる。
const FADE_MASK = "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.35) 30%, #000 65%)";

/**
 * アクティビティ一覧カードの右端に敷く種別イラスト（名前からシーンを選ぶ）。
 *
 * カードは同時に何枚も並ぶので静止版を使う（動き付きは表示枚数に比例して重くなる）。
 * 親要素に `relative overflow-hidden` が必要。
 */
export default function ActivityCardIllustration({ type, name }: { type?: string; name?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 w-2/5 max-w-[260px]"
      style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
    >
      <Image
        src={getActivityTypeImage({ type, name })}
        alt=""
        fill
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
