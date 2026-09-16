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
    @keyframes tn-drift { 0%,100% { transform: translateX(0) } 50% { transform: translateX(24px) } }
    @keyframes tn-bob   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
    @keyframes tn-pulse { 0%,100% { transform: scale(1); opacity: .28 } 50% { transform: scale(1.09); opacity: .42 } }
    @keyframes tn-twinkle { 0%,100% { opacity: .35 } 50% { opacity: .95 } }
    .tn-drift { animation: tn-drift 26s ease-in-out infinite }
    .tn-drift-slow { animation: tn-drift 38s ease-in-out infinite reverse }
    .tn-bob { animation: tn-bob 4s ease-in-out infinite }
    .tn-pulse { transform-box: fill-box; transform-origin: center; animation: tn-pulse 5s ease-in-out infinite }
    .tn-twinkle { animation: tn-twinkle 3.2s ease-in-out infinite }`;

// prefers-reduced-motion のガードは必ず最後に置く（後勝ちで全クラスを停止させるため）
const REDUCED = `
    @media (prefers-reduced-motion: reduce) {
      .tn-drift, .tn-drift-slow, .tn-bob, .tn-pulse, .tn-twinkle,
      .tn-speed, .tn-steam, .tn-float, .tn-drop, .tn-shadow { animation: none }
    }`;

const EXTRA = {
  transport: `
    @keyframes tn-speed { 0% { transform: translateX(46px); opacity: 0 } 25% { opacity: .75 } 100% { transform: translateX(-70px); opacity: 0 } }
    .tn-speed { animation: tn-speed 2.2s linear infinite }`,
  restaurant: `
    @keyframes tn-steam { 0% { transform: translateY(10px); opacity: 0 } 25% { opacity: .9 } 100% { transform: translateY(-26px); opacity: 0 } }
    .tn-steam { animation: tn-steam 3.4s ease-out infinite }
    .tn-steam-2 { animation-delay: 1.1s } .tn-steam-3 { animation-delay: 2.2s }`,
  activity: `
    @keyframes tn-float { 0%,100% { transform: translateY(0) rotate(-.6deg) } 50% { transform: translateY(-9px) rotate(.6deg) } }
    .tn-float { transform-box: fill-box; transform-origin: 400px 300px; animation: tn-float 6s ease-in-out infinite }`,
  area: `
    @keyframes tn-drop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
    @keyframes tn-shadow { 0%,100% { transform: scale(1); opacity: .25 } 50% { transform: scale(.84); opacity: .16 } }
    .tn-drop { animation: tn-drop 3.4s ease-in-out infinite }
    .tn-shadow { transform-box: fill-box; transform-origin: center; animation: tn-shadow 3.4s ease-in-out infinite }`,
};

// 種別ごとに「どの要素を動かすか」。[検索文字列, 置換文字列]
const EDITS = {
  transport: [
    ['<g fill="#FFFFFF" opacity="0.9">\n      <circle cx="104"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.9">\n      <circle cx="104"'],
    ['<g fill="#FFFFFF" opacity="0.7">\n      <circle cx="596"', '<g class="tn-drift-slow" fill="#FFFFFF" opacity="0.7">\n      <circle cx="596"'],
    ['<g fill="#FFFDF6" opacity="0.95">', '<g class="tn-bob" fill="#FFFDF6" opacity="0.95">'],
    ['<!-- 車体 -->\n    <g>', '<!-- 車体 -->\n    <g class="tn-bob">'],
    ['<g fill="#FFFFFF" opacity="0.75">\n      <rect x="18"', '<g class="tn-speed" fill="#FFFFFF" opacity="0.75">\n      <rect x="18"'],
  ],
  sightseeing: [
    ['<circle cx="656" cy="86" r="62" fill="#FFE29A" opacity="0.28"/>', '<circle class="tn-pulse" cx="656" cy="86" r="62" fill="#FFE29A" opacity="0.28"/>'],
    ['<g fill="#FFFFFF" opacity="0.85">\n      <circle cx="120"', '<g class="tn-drift" fill="#FFFFFF" opacity="0.85">\n      <circle cx="120"'],
    ['<circle cx="384" cy="184" r="9" fill="#FFFFFF" opacity="0.9"/>', '<circle class="tn-twinkle" cx="384" cy="184" r="9" fill="#FFFFFF" opacity="0.9"/>'],
  ],
  restaurant: [
    ['<path d="M360 104 C 344 84 376 72 360 50"/>', '<path class="tn-steam" d="M360 104 C 344 84 376 72 360 50"/>'],
    ['<path d="M408 92 C 392 70 424 58 408 34"/>', '<path class="tn-steam tn-steam-2" d="M408 92 C 392 70 424 58 408 34"/>'],
    ['<path d="M456 106 C 440 86 472 74 456 52"/>', '<path class="tn-steam tn-steam-3" d="M456 106 C 440 86 472 74 456 52"/>'],
  ],
  hotel: [
    ['<g fill="#FFFDF6" opacity="0.9">\n      <circle cx="604"', '<g class="tn-twinkle" fill="#FFFDF6" opacity="0.9">\n      <circle cx="604"'],
    ['<g fill="#FFFFFF" opacity="0.8">\n      <path d="M120 66', '<g class="tn-twinkle" fill="#FFFFFF" opacity="0.8">\n      <path d="M120 66'],
    ['<circle cx="704" cy="152" r="34" fill="#FFE29A" opacity="0.35"/>', '<circle class="tn-pulse" cx="704" cy="152" r="34" fill="#FFE29A" opacity="0.35"/>'],
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
