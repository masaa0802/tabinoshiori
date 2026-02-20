import React from "react";

interface LoadingAirplaneProps {
  /** ページ全体のローディング表示に使う場合 true */
  fullPage?: boolean;
  /** fullPage 時に表示するメッセージ */
  message?: string;
}

const CirclingAirplane: React.FC<{ size: number }> = ({ size }) => {
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 点線の円 */}
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
      {/* 旋回する飛行機 */}
      <div className="absolute inset-0 animate-orbit">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500 absolute"
          style={{ top: -2, left: '50%', transform: 'translateX(-50%) rotate(90deg)' }}
        >
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>
    </div>
  );
};

const LoadingAirplane: React.FC<LoadingAirplaneProps> = ({ fullPage = false, message }) => {
  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4">
            <CirclingAirplane size={80} />
          </div>
          {message && <p className="text-gray-600">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center">
      <CirclingAirplane size={28} />
    </div>
  );
};

export default LoadingAirplane;
