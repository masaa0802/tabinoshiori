import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "旅のしおり - 旅行計画をもっと簡単に、もっと楽しく";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Google Fonts から Noto Sans JP（日本語）を取得
  const fontData = await fetch(
    "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfkZmZ82BnH0YYIG7MEkbQFbmVWqrBZwbGdMJKNVpvWJ-V5RWQ1j3pJYI8bUvGHAlOhFAEDqsQJwYlXJ8bQ.0.woff2"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Noto Sans JP'",
        }}
      >
        {/* Emerald グロー（左） */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "130%",
            background:
              "radial-gradient(ellipse, rgba(16,185,129,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Blue グロー（右） */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "60%",
            height: "130%",
            background:
              "radial-gradient(ellipse, rgba(59,130,246,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
            zIndex: 10,
            padding: "0 80px",
          }}
        >
          {/* タイトル */}
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
              lineHeight: 1.1,
            }}
          >
            旅のしおり
          </div>

          {/* デコレーションライン */}
          <div
            style={{
              width: 140,
              height: 6,
              background: "linear-gradient(90deg, #f472b6 0%, #fbbf24 100%)",
              borderRadius: 3,
            }}
          />

          {/* サブタイトル */}
          <div
            style={{
              fontSize: 36,
              color: "#bfdbfe",
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            旅行計画をもっと簡単に、もっと楽しく
          </div>

          {/* 機能バッジ */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginTop: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {["日程管理", "マップ確認", "予算管理", "URLで共有"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "100px",
                  padding: "10px 24px",
                  fontSize: 26,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          weight: 900,
        },
      ],
    }
  );
}
