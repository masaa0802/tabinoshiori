'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_FAQ = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FAQ;

/**
 * FAQセクション直下に配置するGoogle AdSense広告枠。
 * 環境変数(NEXT_PUBLIC_ADSENSE_CLIENT_ID / NEXT_PUBLIC_ADSENSE_SLOT_FAQ)が
 * 未設定の場合はプレースホルダーを表示する(ローカル開発・審査待ち時の安全策)。
 */
const AdSlot: React.FC = () => {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT_FAQ) return;
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSenseスクリプト未読込などは広告非表示のまま無視する
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <p className="text-center text-[10px] text-gray-400 tracking-widest mb-2">広告</p>
      {ADSENSE_CLIENT && ADSENSE_SLOT_FAQ ? (
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: 90 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT_FAQ}
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
