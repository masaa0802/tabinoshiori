/**
 * Google AdSense 用の広告枠(プレースホルダー)。
 * 実際の運用時は下記コメント部分を <ins className="adsbygoogle" ...> に置き換える。
 */
const AdSlot: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <p className="text-center text-[10px] text-gray-400 tracking-widest mb-2">広告</p>
      <div className="min-h-[100px] md:min-h-[90px] flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
        <span className="text-sm text-gray-400">Google AdSense 広告枠(レスポンシブ)</span>
      </div>
      {/*
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      */}
    </div>
  );
};

export default AdSlot;
