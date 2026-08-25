/**
 * 機能紹介グリッドに馴染ませるインフィード広告(プレースホルダー)。
 * 周囲のカードと同じ見た目にしつつ「広告」ラベルで区別する。
 * 実際の運用時は下記コメント部分を <ins className="adsbygoogle" ...> に置き換える。
 */
const AdSlotInFeed: React.FC = () => {
  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row md:col-span-3">
      <span className="absolute top-3 right-3 text-[10px] text-gray-400 tracking-widest bg-white/80 px-1.5 py-0.5 rounded z-10">
        広告
      </span>
      <div className="md:w-72 flex-shrink-0 min-h-[160px] md:min-h-[140px] flex items-center justify-center border-b md:border-b-0 md:border-r border-dashed border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-400 px-6 text-center">
          Google AdSense インフィード広告枠
        </span>
      </div>
      <div className="p-8 flex items-center">
        <p className="text-sm text-gray-400">広告主のコンテンツがここに表示されます</p>
      </div>
      {/*
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-XX+XX-XX-X"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
      />
      */}
    </div>
  );
};

export default AdSlotInFeed;
