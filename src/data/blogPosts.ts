/**
 * ブログのシードデータ（サンプル記事）。
 *
 * microCMS の環境変数が未設定のときに queries.ts がフォールバック先として使う。
 * 実記事の入稿が完了したら、このファイルと queries.ts のフォールバック分岐を削除する。
 */
import type { BlogPost, Category, Souvenir, Spot } from "@/lib/microcms/types";

export const seedCategories: Category[] = [
  {
    id: "destination-guide",
    slug: "destination-guide",
    name: "目的地ガイド",
    description: "行き先ごとの基本情報と、現地での動き方をまとめています。",
    order: 1,
  },
  {
    id: "preparation",
    slug: "preparation",
    name: "旅の準備",
    description: "出発前に決めること・そろえるものを、順番に整理します。",
    order: 2,
  },
  {
    id: "model-course",
    slug: "model-course",
    name: "モデルコース",
    description: "日数別の回り方の例。そのまま真似できる形で紹介します。",
    order: 3,
  },
  {
    id: "souvenir",
    slug: "souvenir",
    name: "お土産ガイド",
    description: "現地で買えるお土産を、買える場所と確認日つきで紹介します。",
    order: 4,
  },
];

function category(slug: string): Category {
  const found = seedCategories.find((c) => c.slug === slug);
  if (!found) throw new Error(`シードデータに存在しないカテゴリです: ${slug}`);
  return found;
}

const kyotoSpots: Spot[] = [
  {
    id: "kiyomizu-dera",
    name: "清水寺",
    description:
      "京都でもっとも人が集まる寺のひとつ。朝6時から開いているので、混雑を避けたいなら開門直後がおすすめ。",
    address: "京都府京都市東山区清水1-294",
    activityType: "観光",
    lat: 34.9948,
    lng: 135.785,
  },
  {
    id: "fushimi-inari",
    name: "伏見稲荷大社",
    description:
      "千本鳥居で知られる神社。24時間参拝でき、山頂まで往復すると2時間ほどかかる。",
    address: "京都府京都市伏見区深草藪之内町68",
    activityType: "観光",
    lat: 34.9671,
    lng: 135.7727,
  },
  {
    id: "nishiki-market",
    name: "錦市場",
    description:
      "食べ歩きができる商店街。夕方には閉まる店が多いので、昼過ぎまでに立ち寄りたい。",
    address: "京都府京都市中京区西大文字町609",
    activityType: "グルメ",
    lat: 35.005,
    lng: 135.7649,
  },
];

const taipeiSpots: Spot[] = [
  {
    id: "taipei-101",
    name: "台北101",
    description:
      "台北の中心にある超高層ビル。展望台からは市街地を一望できる。地下のフードコートは値段が手ごろ。",
    address: "台北市信義區信義路五段7號",
    activityType: "観光",
    lat: 25.0338,
    lng: 121.5645,
  },
  {
    id: "shilin-night-market",
    name: "士林夜市",
    description:
      "台北最大級の夜市。18時ごろから賑わい始める。現金しか使えない屋台が多いので小額紙幣を用意しておく。",
    address: "台北市士林區基河路101號",
    activityType: "グルメ",
    lat: 25.0879,
    lng: 121.524,
  },
];

/**
 * お土産ガイドのレイアウト確認用サンプル。
 * **価格・販売場所・日本での取り扱いはいずれも仮の値で、調査した事実ではない。**
 * サンプルと分かるよう、価格の表記に「サンプル」と入れてある。
 */
const taipeiSouvenirs: Souvenir[] = [
  {
    id: "pineapple-cake",
    name: "パイナップルケーキ",
    genre: "お菓子",
    price: "10個入り 約1,500円（サンプル）",
    comment: "定番中の定番。店ごとに餡の酸味がかなり違うので、試食できる店で選ぶと外れにくい。",
    place: "台北駅の地下街",
    availableInJapan: true,
    japanUrl: "https://www.amazon.co.jp/s?k=%E3%83%91%E3%82%A4%E3%83%8A%E3%83%83%E3%83%97%E3%83%AB%E3%82%B1%E3%83%BC%E3%82%AD",
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "nougat",
    name: "ヌガー（牛軋糖）",
    genre: "お菓子",
    price: "1袋 約800円（サンプル）",
    comment: "ナッツ入りのやわらかいヌガー。夏は溶けやすいので、持ち帰りは保冷バッグがあると安心。",
    place: "迪化街の菓子店",
    availableInJapan: false,
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "dried-mango",
    name: "ドライマンゴー",
    genre: "お菓子",
    price: "1袋 約700円（サンプル）",
    place: "迪化街の乾物店",
    availableInJapan: false,
    sponsored: false,
    checkedAt: "2026-02-20T00:00:00.000Z",
  },
  {
    id: "oolong-tea",
    name: "台湾烏龍茶（高山茶）",
    genre: "お茶・食品",
    price: "茶葉75g 約2,000円（サンプル）",
    comment: "量り売りの店なら、試飲してから少量ずつ買える。真空パックにしてもらうと香りが長持ちする。",
    place: "永康街の茶葉店",
    availableInJapan: true,
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "karasumi",
    name: "からすみ",
    genre: "お茶・食品",
    price: "1枚 約3,000円（サンプル）",
    comment: "真空パックのものを選ぶと持ち帰りやすい。贈り物にすると喜ばれやすい一品。",
    place: "迪化街の乾物店",
    availableInJapan: false,
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "hakka-pouch",
    name: "客家花布のポーチ",
    genre: "雑貨",
    price: "1個 約600円（サンプル）",
    comment: "赤やピンクの大きな花柄が目印の布小物。軽くてかさばらないので、配る用にまとめ買いしやすい。",
    place: "迪化街の布市場",
    availableInJapan: false,
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "easycard-design",
    name: "キャラクター柄の悠遊カード",
    genre: "雑貨",
    price: "1枚 約500円（サンプル）",
    comment: "見た目は雑貨だが、交通系ICカードとしてそのまま使える。次の台湾旅行でも出番がある。",
    place: "台北市内のコンビニ",
    availableInJapan: false,
    sponsored: false,
    checkedAt: "2026-09-12T00:00:00.000Z",
  },
];

export const seedPosts: BlogPost[] = [
  {
    id: "kyoto-2days-guide",
    slug: "kyoto-2days-guide",
    title: "京都1泊2日、はじめてでも回りきれるモデルコース",
    excerpt:
      "見どころが多すぎて予定が組めない京都を、1泊2日で無理なく回る順番に整理しました。移動時間込みの現実的なプランです。",
    coverImage: {
      url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1600",
      width: 1600,
      height: 900,
    },
    category: category("model-course"),
    // 先頭は不安タグ（tags.ts のラベルと完全一致させること）。以降は自由タグ
    tags: ["段取りの不安", "国内旅行", "1泊2日", "寺社巡り"],
    destinations: ["京都", "日本"],
    spots: kyotoSpots,
    souvenirs: [],
    publishedAt: "2026-07-14T09:00:00.000Z",
    updatedAt: "2026-08-05T09:00:00.000Z",
    featured: true,
    isDraft: false,
    priceSources: [],
    seoDescription:
      "京都を1泊2日で回るモデルコース。清水寺・伏見稲荷・錦市場を移動時間込みで無理なく組んだ、はじめての京都向けの行程です。",
    body: {
      format: "blocks",
      blocks: [
        {
          type: "paragraph",
          text: "京都で予定が組めなくなる原因は、行きたい場所が多いことではなく、場所どうしの距離感がつかめないことにあります。地図で近く見えても、バスだと30分かかる区間は珍しくありません。ここでは移動時間を先に確保したうえで、1泊2日に収まる順番を紹介します。",
        },
        { type: "heading", text: "1日目: 東山エリアを南から北へ" },
        {
          type: "paragraph",
          text: "午前中に清水寺へ向かいます。開門は朝6時と早く、9時を過ぎると参道が一気に混み始めるため、早い時間ほど快適です。清水寺から二年坂・産寧坂を下りながら北へ歩くと、そのまま八坂神社まで徒歩圏内でつながります。",
        },
        {
          type: "list",
          items: [
            "8:00 清水寺（滞在1時間）",
            "9:30 二年坂・産寧坂を散策しながら北上",
            "11:00 八坂神社",
            "12:00 祇園でお昼",
            "14:00 錦市場で食べ歩き",
          ],
        },
        {
          type: "quote",
          text: "京都のバスは観光シーズンに大幅に遅れます。徒歩でつながる区間は歩く前提で組むほうが、結果的に予定どおりに進みます。",
        },
        { type: "heading", text: "2日目: 伏見稲荷は朝いちばんに" },
        {
          type: "paragraph",
          text: "伏見稲荷大社は24時間参拝できるため、混雑を避けるなら朝8時前が狙い目です。千本鳥居だけ見て引き返すなら30分、山頂まで往復するなら2時間を見ておきます。体力と相談して、先に折り返し地点を決めておくと予定が崩れません。",
        },
        {
          type: "list",
          items: [
            "7:30 伏見稲荷大社（千本鳥居のみなら30分、山頂往復なら2時間）",
            "10:30 京都駅へ戻る",
            "11:30 京都駅周辺でお昼・お土産",
            "13:00 出発",
          ],
        },
        { type: "heading", text: "詰め込みすぎないための目安" },
        {
          type: "paragraph",
          text: "1日に回る観光地は3か所までにすると、移動と休憩の余裕が生まれます。4か所以上を入れた行程は、どこかで必ず巻きが必要になり、結局どこも駆け足になりがちです。行きたい場所が5つあるなら、2日に分けるか、次の旅に回すほうが満足度は高くなります。",
        },
      ],
    },
  },
  {
    id: "first-overseas-packing-list",
    slug: "first-overseas-packing-list",
    title: "はじめての海外旅行、本当に必要な持ち物だけのチェックリスト",
    excerpt:
      "持ち物リストは長いほど不安になります。現地で買えるもの・買えないものを分けて、出発前に用意すべきものだけを整理しました。",
    coverImage: {
      url: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=1600",
      width: 1600,
      height: 900,
    },
    category: category("preparation"),
    tags: ["手続きの不安", "持ち物", "海外旅行", "はじめての旅行"],
    destinations: [],
    spots: [],
    souvenirs: [],
    publishedAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-07-28T09:00:00.000Z",
    featured: false,
    isDraft: false,
    priceSources: [],
    seoDescription:
      "はじめての海外旅行の持ち物を「現地で買えないもの」から逆算して整理。パスポート・常備薬・変換プラグなど、出発前に必ず用意すべきものだけをまとめました。",
    body: {
      format: "blocks",
      blocks: [
        {
          type: "paragraph",
          text: "持ち物リストを検索すると、100項目を超えるものが出てきます。ただ、そのほとんどは現地のコンビニやドラッグストアで買えるものです。荷造りの不安を減らすコツは、リストを増やすことではなく「現地で手に入らないもの」に絞って考えることです。",
        },
        { type: "heading", text: "現地で買えないもの（忘れたら困る）" },
        {
          type: "list",
          items: [
            "パスポート（残存有効期間が6か月以上あるか要確認）",
            "ビザ・ESTA などの渡航認証",
            "航空券の予約確認書（スマホの画面と紙の両方）",
            "クレジットカード（海外で使える国際ブランドを2枚)",
            "処方薬（英文の処方箋があるとより安心）",
            "海外旅行保険の証書",
          ],
        },
        {
          type: "paragraph",
          text: "このうち、出発直前に用意できないのはパスポートと渡航認証です。パスポートの新規発給は申請から受け取りまで1〜2週間、ESTA は原則72時間前までの申請が必要になります。旅行を決めたら、行き先の入国要件をいちばん最初に確認しておくと後が楽です。",
        },
        { type: "heading", text: "現地調達が難しく、あると便利なもの" },
        {
          type: "list",
          items: [
            "変換プラグ（行き先のコンセント形状を事前に確認）",
            "モバイルバッテリー（預け入れ荷物には入れられないので手荷物へ）",
            "使い慣れた常備薬（胃腸薬・鎮痛剤）",
            "圧縮袋（帰りの荷物が増えたとき用）",
          ],
        },
        { type: "heading", text: "現地で買えばいいもの" },
        {
          type: "paragraph",
          text: "シャンプー・歯ブラシ・洗剤・傘などは、たいていの都市でその日のうちに買えます。日本から持っていくと荷物が重くなるだけなので、こだわりがなければ現地調達で十分です。着替えも、3日分あれば洗濯しながら回せます。",
        },
        {
          type: "quote",
          text: "「足りなかったらどうしよう」ではなく「足りなくても買える場所があるか」で判断すると、荷物は半分になります。",
        },
      ],
    },
  },
  {
    id: "cheap-flight-timing",
    slug: "cheap-flight-timing",
    title: "航空券が安くなる時期の見つけ方（値段ではなく仕組みで考える）",
    excerpt:
      "航空券の値段は需要で動きます。具体的な金額を覚えるのではなく、値下がりが起きる条件を知っておくほうが長く使えます。",
    coverImage: {
      url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1600",
      width: 1600,
      height: 900,
    },
    category: category("preparation"),
    tags: ["お金の不安", "費用", "航空券", "節約"],
    destinations: [],
    spots: [],
    souvenirs: [],
    publishedAt: "2026-08-11T09:00:00.000Z",
    updatedAt: "2026-08-11T09:00:00.000Z",
    featured: false,
    isDraft: false,
    // 金額を含む記事なので調査時点と出典を設定する。記事冒頭に注釈バナーが出る
    priceCheckedAt: "2026-08-01T00:00:00.000Z",
    priceSources: ["（サンプル）実記事では実際に確認した出典に差し替えること"],
    seoDescription:
      "航空券が安くなる時期を、需要の増減という仕組みから解説。閑散期の見つけ方、曜日の選び方、予約時期の目安をまとめました。",
    body: {
      format: "blocks",
      blocks: [
        {
          type: "paragraph",
          text: "航空券の価格を紹介する記事は多いのですが、金額は燃油費や為替で毎年変わります。そこでここでは金額ではなく、値段が動く仕組みを整理します。仕組みを知っておけば、どの年でも自分で判断できます。",
        },
        { type: "heading", text: "値段を決めているのは需要の山と谷" },
        {
          type: "paragraph",
          text: "航空券は座席の在庫を売り切るための価格設定になっており、需要が集中する時期ほど高く、空席が余る時期ほど安くなります。つまり「多くの人が休みを取る時期」を外せば安くなる、というのが基本の考え方です。",
        },
        {
          type: "list",
            items: [
            "需要の山: 年末年始、ゴールデンウィーク、お盆、3月下旬の卒業旅行シーズン",
            "需要の谷: 1月中旬〜2月、ゴールデンウィーク明けの5月中旬〜6月、11月",
          ],
        },
        {
          type: "paragraph",
          text: "谷の時期に共通しているのは、大型連休の直後で、かつ次の連休までに間があることです。学校の長期休暇とも重なりません。逆に言えば、カレンダーを見て「連休から遠い平日」を探せば、その年の閑散期はおおよそ見当がつきます。",
        },
        {
          type: "paragraph",
          text: "実際に山と谷でどのくらい差が出るのか、同じ路線・同じ航空会社で比べると次のようになります。",
        },
        {
          // 金額を出すときは出典と調査時点を必ず併記する（型で必須にしてある）
          type: "price",
          figure: {
            label: "【サンプル】東京→ソウル 往復・エコノミー最安運賃",
            value: "閑散期 2万円台 / 繁忙期 5万円台",
            note: "直行便・受託手荷物なしの運賃。空席状況により変動します。※これはレイアウト確認用のサンプル値です。実記事では必ず自分で確認した数値に差し替えてください。",
            source: "（サンプル）実記事では確認した予約サイト名・航空会社名を入れる",
            surveyedAt: "2026年8月",
          },
        },
        {
          type: "paragraph",
          text: "路線や時期によって幅はありますが、山と谷で倍近く変わることは珍しくありません。日程をずらせる旅行であれば、まず谷の時期を候補にしてから宿や予定を組むほうが、全体の予算は下げやすくなります。",
        },
        { type: "heading", text: "出発曜日で変わる" },
        {
          type: "paragraph",
          text: "同じ週でも、金曜夜と日曜夜の出発は帰省・週末旅行の需要と重なるため高くなりがちです。火曜・水曜の出発に1日ずらすだけで下がることがあるので、日程に融通が利くなら前後1日を必ず比較してみてください。",
        },
        { type: "heading", text: "予約のタイミング" },
        {
          type: "paragraph",
          text: "早ければ早いほど安いわけではありません。多くの航空会社は出発の11か月前から販売を始めますが、初期は高めの運賃から売り出し、売れ行きを見ながら調整します。国際線であれば出発の2〜3か月前、国内線であれば1〜2か月前が、選択肢と価格のバランスが取れる時期です。",
        },
        {
          type: "quote",
          text: "直前になるほど安くなる、という考え方は現在はほぼ通用しません。空席が残っていても、残席が少ないほど高い運賃クラスしか残らないためです。",
        },
        { type: "heading", text: "比較するときの注意点" },
        {
          type: "list",
          items: [
            "表示価格に受託手荷物・座席指定が含まれるか確認する",
            "乗り継ぎ便は総移動時間と乗り継ぎ時間を必ず見る",
            "深夜着の便は空港から市内への交通手段が限られる",
          ],
        },
        {
          type: "paragraph",
          text: "運賃だけを比べると、手荷物代や空港からの移動費で結局高くつくことがあります。「空港を出て宿に着くまで」の合計で比べるようにすると、判断を間違えにくくなります。",
        },
      ],
    },
  },
  {
    id: "taipei-travel-guide",
    slug: "taipei-travel-guide",
    title: "台北のはじめ方 — 空港から市内、移動、両替まで",
    excerpt:
      "はじめての台北で迷いやすいのは観光地そのものより、空港からの移動と支払い方法です。着いた日に困らない分だけ先にまとめました。",
    coverImage: {
      url: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=1600",
      width: 1600,
      height: 900,
    },
    category: category("destination-guide"),
    tags: ["現地の不安", "台湾", "アジア", "はじめての旅行"],
    destinations: ["台湾", "台北"],
    spots: taipeiSpots,
    souvenirs: [],
    publishedAt: "2026-08-18T09:00:00.000Z",
    updatedAt: "2026-08-18T09:00:00.000Z",
    featured: false,
    isDraft: false,
    priceSources: [],
    seoDescription:
      "はじめての台北向けガイド。桃園空港から市内への行き方、悠遊カードでの移動、両替のタイミングなど、到着日に必要な情報をまとめました。",
    body: {
      format: "blocks",
      blocks: [
        {
          type: "paragraph",
          text: "台北は日本から3〜4時間で着き、物価も比較的おだやかなため、はじめての海外旅行先に選ばれることの多い都市です。ただ、到着した日にいちばんつまずきやすいのは観光ではなく、空港から市内までの移動と支払い方法です。まずそこから整理します。",
        },
        { type: "heading", text: "桃園空港から台北市内へ" },
        {
          type: "paragraph",
          text: "主要な選択肢は3つです。所要時間と料金のバランスから、はじめてなら空港MRT（桃園機場捷運）がわかりやすいでしょう。台北駅まで直通で、ホームの案内表示に日本語が併記されています。",
        },
        {
          type: "list",
          items: [
            "空港MRT: 台北駅まで約35〜50分。本数が多く、料金も手ごろ",
            "国光客運などのバス: 台北駅まで約60分。荷物が多いときは座って行ける",
            "タクシー: 40分前後。深夜着や複数人ならこれが現実的",
          ],
        },
        { type: "heading", text: "悠遊カード（EasyCard）を最初に買う" },
        {
          type: "paragraph",
          text: "MRT・バス・コンビニで使える交通系ICカードです。空港の駅窓口やコンビニで購入でき、チャージも同じ場所でできます。都度きっぷを買う手間がなくなるうえ、MRT運賃が割引になるため、滞在初日に用意しておくのが結局いちばん楽です。",
        },
        { type: "heading", text: "両替はどこでするか" },
        {
          type: "paragraph",
          text: "台湾は現金が必要な場面が残っています。とくに夜市の屋台や個人商店はカードが使えないことが多いため、ある程度の現金は必要です。空港の銀行窓口はレートが極端に悪いわけではないので、到着時に数日分だけ両替し、足りなくなったら市内の銀行やATMで追加する方法が無難です。",
        },
        {
          type: "quote",
          text: "夜市に行く日は、少額紙幣を多めに用意しておくと支払いがスムーズです。屋台では高額紙幣のおつりが用意されていないことがあります。",
        },
        { type: "heading", text: "到着日の動き方" },
        {
          type: "paragraph",
          text: "午後に着く便なら、初日は宿の周辺と夜市だけにしておくのがおすすめです。移動と両替、カードの購入で思ったより時間を使います。本格的な観光は翌日からにすると、初日に予定が崩れて焦ることがありません。",
        },
      ],
    },
  },
  {
    id: "taipei-souvenir-guide",
    slug: "taipei-souvenir-guide",
    title: "【サンプル】台北のお土産ガイド — 現地でしか買えないものを先に",
    excerpt:
      "日本でも買えるものと、台北でしか手に入らないものを分けて紹介します。買える場所と確認日つきなので、旅程に組み込みやすくなっています。",
    category: category("souvenir"),
    tags: ["お金の不安", "台湾", "お土産"],
    destinations: ["台湾", "台北"],
    spots: [],
    souvenirs: taipeiSouvenirs,
    publishedAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-09-15T09:00:00.000Z",
    featured: false,
    isDraft: false,
    priceCheckedAt: "2026-09-12T00:00:00.000Z",
    priceSources: ["サンプル（レイアウト確認用の仮の値）"],
    body: {
      format: "blocks",
      blocks: [
        {
          type: "paragraph",
          text: "お土産選びで迷う原因は、候補が多いことより「それ、日本でも買えるのでは？」が分からないことにあります。ここではジャンルごとに分けたうえで、日本で手に入るかどうかを写真の上に表示しています。現地でしか買えないものから優先して選んでください。",
        },
      ],
    },
  },
];
