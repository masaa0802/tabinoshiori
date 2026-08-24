import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "旅のしおりのプライバシーポリシー。個人情報の取り扱いについて説明しています。",
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: "利用規約 | 旅のしおり",
    description: "旅のしおりのプライバシーポリシー。個人情報の取り扱いについて説明しています。",
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
              旅のしおり
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
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">プライバシーポリシー</h1>

          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="text-sm text-gray-500 mb-8">最終更新日：2026年2月8日</p>

            <section className="mb-8">
              <p className="mb-4">
                Terms-md（以下「運営者」といいます。）は、本サービス上で提供するサービス（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第1条（個人情報の定義）</h2>
              <p className="mb-4">
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報（個人識別符号となるものを含む）を指します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第2条（情報の収集方法）</h2>
              <p className="mb-4">運営者は、ユーザーが本サービスを利用する際、以下の情報を収集する場合があります。</p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>ユーザーが入力フォームに入力する情報（サービス概要、社名、連絡先等）</li>
                <li>ユーザー登録時または認証時に提携先（Google等）から提供される情報（氏名、メールアドレス、プロフィール画像等）</li>
                <li>有料プランご利用時に決済サービス（Stripe）を通じて提供される決済関連情報（カード情報はStripeが直接管理し、運営者はカード番号等を保持しません）</li>
                <li>端末情報、ログ情報、Cookie、および匿名ID</li>
                <li>お問い合わせ時に提供される氏名、メールアドレス等の連絡先</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第3条（個人情報を収集・利用する目的）</h2>
              <p className="mb-4">運営者が個人情報を収集・利用する目的は、以下のとおりです。</p>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>本サービスの提供・運営のため</li>
                <li>ユーザー登録、本人確認、認証のため</li>
                <li>有料プランの料金請求、決済処理、およびサブスクリプション管理のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び運営者が提供する他のサービスの案内のメールを送付するため</li>
                <li>メンテナンス、重要なお知らせ、支払いに関する通知など必要に応じたご連絡のため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をお断りするため</li>
                <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                <li>本サービスの改善、および新サービスの開発に向けた分析のため</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第4条（利用目的の変更）</h2>
              <p className="mb-4">
                運営者は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第5条（個人情報の第三者提供）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>
                  運営者は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                    <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                    <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                    <li>その他法令で認められる場合</li>
                  </ul>
                </li>
                <li>
                  前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>運営者が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合（決済処理のためのStripe株式会社への委託を含みます）</li>
                    <li>合併その他の事由による事業の継承に伴って個人情報が提供される場合</li>
                    <li>個人情報を特定の者との間で共同して利用する場合であって、その旨並びに共同して利用される個人情報の項目、共同して利用する者の範囲、利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について、あらかじめ本人に通知し、または本人が容易に知り得る状態に置いた場合</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第6条（安全管理措置）</h2>
              <p className="mb-4">
                運営者は、個人情報の漏えい、滅失またはき損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第7条（Cookie（クッキー）の利用）</h2>
              <p className="mb-4">
                本サービスでは、利用状況を把握し、利便性を向上させるためにCookieを使用する場合があります。ユーザーはブラウザの設定によりCookieを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第8条（SSLの利用について）</h2>
              <p className="mb-4">
                本サービスでは、個人情報を保護するために「SSL（Secure Sockets Layer）」による暗号化通信を導入しています。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第9条（退会時のデータ削除）</h2>
              <ol className="list-decimal pl-6 mb-4 space-y-2">
                <li>
                  ユーザーが本サービスを退会した場合、運営者は当該ユーザーに関する以下の情報を速やかに削除します。
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>ユーザーが作成した全てのドキュメント</li>
                    <li>ユーザーのアカウント情報（認証情報を含む）</li>
                    <li>その他、ユーザーに紐づく全てのデータ</li>
                  </ul>
                </li>
                <li>前項にかかわらず、運営者は不正利用の防止およびサブスクリプション管理上の必要性から、退会ユーザーの一部情報（退会日時、退会理由等）を一定期間保持する場合があります。保持された情報は、保持の目的が達成された後、速やかに削除します。</li>
                <li>削除されたデータは復元することができません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">第10条（お問い合わせ窓口）</h2>
              <p className="mb-4">
                本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p>support@termsmd.com</p>
              </div>
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
            旅のしおり
          </Link>
          <p className="text-gray-400 mt-2">© {new Date().getFullYear()} 旅のしおり All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
