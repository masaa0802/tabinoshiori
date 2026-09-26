import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "スマしおりの利用規約。サービスのご利用条件について説明しています。",
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: "利用規約 | スマしおり",
    description: "スマしおりの利用規約。サービスのご利用条件について説明しています。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">
              スマしおり
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-800 transition-colors">
              ← トップに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">利用規約</h1>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-500 mb-8">最終更新日：2026年8月24日</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第1条（適用）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>本規約は、後藤 雅尭（以下「運営者」といいます。）が提供する「スマしおり」サービス（以下「本サービス」といいます。）の利用条件を定めるものです。</li>
                <li>利用者は、本サービスを利用することにより、本規約のすべての条項に同意したものとみなされます。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第2条（利用登録）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>本サービスは、アカウント登録を必要とせず、利用者は登録なしで即時に利用を開始できます。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第3条（禁止事項）</h2>
              <p className="mb-4">利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>運営者、他の利用者、または第三者の知的財産権、肖像権、プライバシー、名誉、その他の権利または利益を侵害する行為</li>
                <li>本サービスを通じて、コンピューター・ウィルスその他の有害なプログラムを送信または流布する行為</li>
                <li>本サービスのネットワークまたはシステム等に過度の負荷をかける行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第4条（本サービスの提供の停止等）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>
                  運営者は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができるものとします。
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>本サービスに係るコンピューター・システムの点検または保守作業を緊急に行う場合</li>
                    <li>コンピューター、通信回線等が事故により停止した場合</li>
                    <li>火災、停電、その他の不可抗力により、本サービスの提供が困難となった場合</li>
                    <li>その他、運営者が本サービスの提供の停止または中断が必要と判断した場合</li>
                  </ol>
                </li>
                <li>運営者は、本サービスの提供の停止または中断により、利用者または第三者に生じた損害について、一切の責任を負わないものとします。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第5条（著作権）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>利用者が本サービスを通じて投稿、アップロード、またはその他の方法で提供するコンテンツ（旅行の日程、予算、予約情報、スポット情報など）に関する著作権は、当該利用者に帰属します。</li>
                <li>利用者は、運営者に対し、本サービス上でのコンテンツの利用（複製、翻案、公衆送信、その他一切の利用を含みます。）を、無償かつ非独占的に許諾するものとします。</li>
                <li>利用者は、運営者および本サービスユーザーに対し、自身のコンテンツについて著作者人格権を行使しないことに同意するものとします。</li>
                <li>本サービスを構成するすべてのソフトウェア、プログラム、サービス、およびそれに付随する情報（テキスト、画像、音声、動画など）に関する著作権、その他の知的財産権は、運営者または運営者に権利を許諾した第三者に帰属します。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第6条（利用制限および登録抹消）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>運営者は、利用者が本規約のいずれかの条項に違反した場合、またはその他の理由で運営者が不適切と判断した場合には、利用者に事前に通知することなく、当該利用者による本サービスの利用の全部もしくは一部を一時停止し、または利用者を本サービスから退会させることができるものとします。</li>
                <li>運営者は、本条に基づき運営者が行った措置によって利用者に生じた損害について、一切の責任を負いません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第7条（免責事項）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                <li>運営者は、本サービスに起因して利用者に生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する運営者と利用者の間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されませんが、その場合でも、運営者の過失（重過失を除きます。）による債務不履行または不法行為により利用者に生じた損害のうち特別な事情から生じた損害（運営者または利用者が損害発生につき予見し、または予見し得た場合を含みます。）については、一切の責任を負いません。</li>
                <li>運営者は、本サービスに関して、利用者間または利用者と第三者との間で生じたトラブルについて、一切の責任を負いません。</li>
                <li>利用者は、本サービスを利用したことにより、第三者に損害を与えた場合、自己の責任においてこれを解決するものとし、運営者に一切の迷惑または損害を与えないものとします。</li>
                <li>本サービスは、Googleマップ等の外部サービスと連携していますが、これらの外部サービスの利用に起因して利用者に生じた損害について、運営者は一切の責任を負いません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第8条（サービス内容の変更等）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>運営者は、利用者に通知することなく、本サービスの内容の全部または一部を変更、停止または廃止することができるものとし、これについて一切の責任を負いません。</li>
                <li>本サービスは、すべての機能を無料で提供します。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第9条（利用規約の変更）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>運営者は、運営者が必要と判断した場合には、利用者に通知することなくいつでも本規約を変更できるものとします。</li>
                <li>変更後の利用規約は、運営者が別途定める場合を除き、本サービス上に表示した時点から効力を生じるものとします。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第10条（準拠法・裁判管轄）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
              </ol>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                本規約についてご質問がございましたら、
                <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 underline">
                  お問い合わせページ
                </Link>
                よりご連絡ください。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8 px-4 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            スマしおり
          </Link>
          <p className="text-gray-400 mt-2">© {new Date().getFullYear()} スマしおり All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
