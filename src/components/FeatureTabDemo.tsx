"use client";

import { useState } from "react";

const TABS = [
  { value: "plan", label: "旅行プラン" },
  { value: "budget", label: "予算" },
  { value: "info", label: "情報" },
] as const;

type Tab = (typeof TABS)[number]["value"];

const PlanPreview = () => (
  <div className="space-y-2">
    {[
      { color: "bg-green-500", name: "金閣寺", time: "09:00" },
      { color: "bg-orange-500", name: "昼食 錦市場", time: "12:00" },
      { color: "bg-purple-500", name: "京都ホテル チェックイン", time: "16:00" },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
        <span className="text-xs text-gray-700 font-medium flex-1 truncate">{item.name}</span>
        <span className="text-xs text-gray-400">{item.time}</span>
      </div>
    ))}
  </div>
);

const BudgetPreview = () => (
  <div className="space-y-2">
    {[
      { color: "bg-blue-100 text-blue-700", label: "交通", name: "新幹線 東京→京都", amount: "¥13,850" },
      { color: "bg-orange-100 text-orange-700", label: "食費", name: "昼食 錦市場", amount: "¥2,400" },
      { color: "bg-purple-100 text-purple-700", label: "宿泊", name: "京都ホテル", amount: "¥18,000" },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${item.color}`}>{item.label}</span>
        <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
        <span className="text-xs font-semibold text-gray-800">{item.amount}</span>
      </div>
    ))}
    <div className="flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-500">合計</span>
      <span className="text-xs font-bold text-blue-700">¥34,250</span>
    </div>
  </div>
);

const InfoPreview = () => (
  <div className="space-y-2">
    {[
      { color: "bg-blue-100 text-blue-700", label: "フライト", name: "ANA 羽田→新千歳", date: "3/15" },
      { color: "bg-purple-100 text-purple-700", label: "ホテル予約", name: "札幌グランドホテル", date: "3/15" },
      { color: "bg-green-100 text-green-700", label: "チケット", name: "小樽運河クルーズ", date: "3/16" },
    ].map((item, i) => (
      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${item.color}`}>{item.label}</span>
        <span className="text-xs text-gray-700 flex-1 truncate">{item.name}</span>
        <span className="text-xs text-gray-400">{item.date}</span>
      </div>
    ))}
  </div>
);

const FeatureTabDemo = () => {
  const [activeTab, setActiveTab] = useState<Tab>("plan");

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-5 pt-5 h-52 relative overflow-hidden">
      {/* タブ */}
      <div className="flex gap-4 mb-3 border-b border-blue-100 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`text-xs pb-1 -mb-2.5 transition-colors ${
              activeTab === tab.value
                ? "font-bold text-blue-600 border-b-2 border-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === "plan" && <PlanPreview />}
      {activeTab === "budget" && <BudgetPreview />}
      {activeTab === "info" && <InfoPreview />}

      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none" />
    </div>
  );
};

export default FeatureTabDemo;
