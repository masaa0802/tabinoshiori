'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_FAQ = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FAQ;

type AdSlotProps = {
  /** 広告ユニットID。省略時は LP の FAQ 直下用のユニットを使う */
  slot?: string;
  /** 外枠のクラス。LP 以外では親の余白に合わせて上書きする */
  className?: string;
};

/**
 * Google AdSense のレスポンシブ広告枠。
 * 環境変数(NEXT_PUBLIC_ADSENSE_CLIENT_ID と広告ユニットID)が未設定の場合、
 * 開発中はプレースホルダーを表示し、本番ビルドでは何も描画しない
 * (審査待ちや設定漏れのときに、空の点線枠が公開ページに出ないようにするため)。
 *
 * 同じインスタンスで push は1回だけ。ページ遷移で別の広告を出したいときは
 * 呼び出し側で `key` を変えて作り直すこと。
 */
const AdSlot: React.FC<AdSlotProps> = ({
  slot = ADSENSE_SLOT_FAQ,
  className = 'max-w-4xl mx-auto px-4',
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const enabled = Boolean(ADSENSE_CLIENT && slot);

  useEffect(() => {
    if (!enabled) return;
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSenseスクリプト未読込などは広告非表示のまま無視する
    }
  }, [enabled]);

  if (!enabled && process.env.NODE_ENV === 'production') return null;

  return (
    <div className={className}>
      <p className="text-center text-[10px] text-gray-400 tracking-widest mb-2">広告</p>
      {enabled ? (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: 90 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="min-h-[100px] md:min-h-[90px] flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <span className="text-sm text-gray-400">Google AdSense 広告枠(レスポンシブ)</span>
        </div>
      )}
    </div>
  );
};

export default AdSlot;
