/**
 * public/images/activity-types/*.svg（静止版）から
 * public/images/activity-types/motion/*.svg（アニメ版）を生成する。
 *
 *   node scripts/build-activity-type-motion.js
 *
 * イラストを描き直したら静止版だけ編集して、このスクリプトを流し直す。
 * 動かすのは各イラスト 1〜3 要素だけ。transform / opacity のみを使い、
 * prefers-reduced-motion: reduce では全て停止する。
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "images", "activity-types");
const OUT = path.join(SRC, "motion");

const COMMON = `
    @keyframes tn-drift { 0%,100% { transform: translateX(0) } 50% { transform: translateX(34px) } }
    @keyframes tn-bob   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
    @keyframes tn-bob-sm { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
    @keyframes tn-pulse { 0%,100% { transform: scale(1); opacity: .26 } 50% { transform: scale(1.18); opacity: .52 } }
    @keyframes tn-breathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
    @keyframes tn-twinkle { 0%,100% { opacity: .15 } 50% { opacity: 1 } }
    .tn-drift { animation: tn-drift 18s ease-in-out infinite }
    .tn-drift-slow { animation: tn-drift 26s ease-in-out infinite reverse }
    .tn-bob { animation: tn-bob 3s ease-in-out infinite }
    .tn-bob-sm { animation: tn-bob-sm 2.4s ease-in-out infinite }
    .tn-bob-slow { animation: tn-bob 4.4s ease-in-out infinite }
    .tn-pulse { transform-box: fill-box; transform-origin: center; animation: tn-pulse 3.6s ease-in-out infinite }
    .tn-breathe { transform-box: fill-box; transform-origin: center; animation: tn-breathe 4s ease-in-out infinite }
    .tn-twinkle { animation: tn-twinkle 2.2s ease-in-out infinite }`;

// prefers-reduced-motion のガードは必ず最後に置く（後勝ちで全クラスを停止させるため）
const REDUCED = `
    @media (prefers-reduced-motion: reduce) {
      .tn-drift, .tn-drift-slow, .tn-bob, .tn-bob-sm, .tn-bob-slow, .tn-pulse, .tn-breathe,
      .tn-twinkle, .tn-speed, .tn-rail, .tn-steam, .tn-float, .tn-drop, .tn-shadow,
      .tn-route { animation: none }
    }`;

const EXTRA = {
  transport: `
    @keyframes tn-speed { 0% { transform: translateX(56px); opacity: 0 } 20% { opacity: .9 } 100% { transform: translateX(-80px); opacity: 0 } }
    @keyframes tn-rail { to { transform: translateX(-48px) } }
    .tn-speed { animation: tn-speed 1.3s linear infinite }
    .tn-rail { animation: tn-rail 0.7s linear infinite }`,
  restaurant: `
    @keyframes tn-steam { 0% { transform: translateY(14px); opacity: 0 } 22% { opacity: .95 } 100% { transform: translateY(-38px); opacity: 0 } }
    .tn-steam { animation: tn-steam 2.4s ease-out infinite }
    .tn-steam-2 { animation-delay: .8s } .tn-steam-3 { animation-delay: 1.6s }`,
  activity: `
    @keyframes tn-float { 0%,100% { transform: translateY(0) rotate(-1.8deg) } 50% { transform: translateY(-18px) rotate(1.8deg) } }
    .tn-float { transform-box: fill-box; transform-origin: 400px 300px; animation: tn-float 4.6s ease-in-out infinite }`,
  area: `
    @keyframes tn-drop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-15px) } }
    @keyframes tn-shadow { 0%,100% { transform: scale(1); opacity: .25 } 50% { transform: scale(.72); opacity: .14 } }
    @keyframes tn-route { to { stroke-dashoffset: -56 } }
    .tn-drop { animation: tn-drop 2.4s ease-in-out infinite }
    .tn-shadow { transform-box: fill-box; transform-origin: center; animation: tn-shadow 2.4s ease-in-out infinite }
    .tn-route { animation: tn-route 2.4s linear infinite }`,
};

// 種別ごとに「どの要素を動かすか」。[検索文字列, 置換文字列]
const EDITS = {
  transport: [
    ['<g fill="#FFFFFF" opacity="0.9">\n      <circle cx="104"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.9">\n      <circle cx="104"'],
    ['<g fill="#FFFFFF" opacity="0.7">\n      <circle cx="596"', '<g class="tn-drift-slow" fill="#FFFFFF" opacity="0.7">\n      <circle cx="596"'],
    ['<g fill="#FFFDF6" opacity="0.95">', '<g class="tn-bob" fill="#FFFDF6" opacity="0.95">'],
    ['<!-- 車体 -->\n    <g>', '<!-- 車体 -->\n    <g class="tn-bob-sm">'],
    ['<rect x="-48" y="300" width="944" height="12" fill="url(#tr-ties)"/>', '<rect class="tn-rail" x="-48" y="300" width="944" height="12" fill="url(#tr-ties)"/>'],
    ['<g fill="#FFFFFF" opacity="0.75">\n      <rect x="18"', '<g class="tn-speed" fill="#FFFFFF" opacity="0.75">\n      <rect x="18"'],
  ],
  sightseeing: [
    ['<circle cx="656" cy="86" r="62" fill="#FFE29A" opacity="0.28"/>', '<circle class="tn-pulse" cx="656" cy="86" r="62" fill="#FFE29A" opacity="0.28"/>'],
    ['<g fill="#FFFFFF" opacity="0.85">\n      <circle cx="120"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.85">\n      <circle cx="120"'],
    ['<circle cx="384" cy="184" r="9" fill="#FFFFFF" opacity="0.9"/>', '<circle class="tn-twinkle" cx="384" cy="184" r="9" fill="#FFFFFF" opacity="0.9"/>'],
    ['<!-- カメラ -->\n    <g>', '<!-- カメラ -->\n    <g class="tn-bob">'],
  ],
  restaurant: [
    ['<path d="M360 104 C 344 84 376 72 360 50"/>', '<path class="tn-steam" d="M360 104 C 344 84 376 72 360 50"/>'],
    ['<path d="M408 92 C 392 70 424 58 408 34"/>', '<path class="tn-steam tn-steam-2" d="M408 92 C 392 70 424 58 408 34"/>'],
    ['<path d="M456 106 C 440 86 472 74 456 52"/>', '<path class="tn-steam tn-steam-3" d="M456 106 C 440 86 472 74 456 52"/>'],
    ['<circle cx="408" cy="212" r="104" fill="#FFFDF6"/>', '<g class="tn-bob-slow"><circle cx="408" cy="212" r="104" fill="#FFFDF6"/>'],
    ['<path d="M430 196 C 448 186 462 198 452 210 C 444 220 424 210 430 196 Z" fill="#8FD094"/>', '<path d="M430 196 C 448 186 462 198 452 210 C 444 220 424 210 430 196 Z" fill="#8FD094"/></g>'],
  ],
  hotel: [
    ['<g fill="#FFFDF6" opacity="0.9">\n      <circle cx="604"', '<g class="tn-twinkle" fill="#FFFDF6" opacity="0.9">\n      <circle cx="604"'],
    ['<g fill="#FFFFFF" opacity="0.8">\n      <path d="M120 66', '<g class="tn-twinkle" fill="#FFFFFF" opacity="0.8">\n      <path d="M120 66'],
    ['<circle cx="704" cy="152" r="34" fill="#FFE29A" opacity="0.35"/>', '<circle class="tn-pulse" cx="704" cy="152" r="34" fill="#FFE29A" opacity="0.35"/>'],
    ['<circle cx="656" cy="92" r="30" fill="#FFF2C4"/>', '<circle class="tn-breathe" cx="656" cy="92" r="30" fill="#FFF2C4"/>'],
  ],
  activity: [
    ['<!-- 気球 -->\n    <g>', '<!-- 気球 -->\n    <g class="tn-float">'],
    ['<g fill="#FFFFFF" opacity="0.9">\n      <circle cx="122"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.9">\n      <circle cx="122"'],
    ['<g fill="#FFFFFF" opacity="0.7">\n      <circle cx="628"', '<g class="tn-drift-slow" fill="#FFFFFF" opacity="0.7">\n      <circle cx="628"'],
  ],
  area: [
    ['<ellipse cx="400" cy="272" rx="46" ry="12" fill="#6B7280" opacity="0.25"/>', '<ellipse class="tn-shadow" cx="400" cy="272" rx="46" ry="12" fill="#6B7280" opacity="0.25"/>'],
    ['<path d="M400 96 C 360 96 328 128 328 168', '<g class="tn-drop"><path d="M400 96 C 360 96 328 128 328 168'],
    ['<circle cx="400" cy="166" r="26" fill="#FFFDF6"/>', '<circle cx="400" cy="166" r="26" fill="#FFFDF6"/></g>'],
    ['stroke="#FFFDF6" stroke-width="4" fill="none" stroke-dasharray="14 14"', 'class="tn-route" stroke="#FFFDF6" stroke-width="4" fill="none" stroke-dasharray="14 14"'],
  ],
  default: [
    ['<!-- スーツケース -->\n    <g>', '<!-- スーツケース -->\n    <g class="tn-bob">'],
    ['<g fill="#FFFFFF" opacity="0.85">\n      <circle cx="132"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.85">\n      <circle cx="132"'],
  ],
};

fs.mkdirSync(OUT, { recursive: true });

for (const [name, ops] of Object.entries(EDITS)) {
  let svg = fs.readFileSync(path.join(SRC, `${name}.svg`), "utf8");

  for (const [find, replace] of ops) {
    if (!svg.includes(find)) {
      throw new Error(`${name}.svg: アニメ対象が見つからない -> ${find.slice(0, 48)}`);
    }
    svg = svg.replace(find, replace);
  }

  const style = `\n  <style>${COMMON}${EXTRA[name] ?? ""}${REDUCED}\n  </style>`;
  svg = svg.replace(/(<svg[^>]*>)/, `$1${style}`);

  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
  console.log(`generated motion/${name}.svg`);
}
