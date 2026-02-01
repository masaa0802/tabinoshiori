import Link from 'next/link';

const page: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 背景画像スライドショー */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 animate-slideshow-1"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2000')",
            }}
          />
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 animate-slideshow-2"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000')",
            }}
          />
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 animate-slideshow-3"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000')",
            }}
          />
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 animate-slideshow-4"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2000')",
            }}
          />
          {/* 暗いオーバーレイで文字を読みやすく */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
          {/* カラーオーバーレイで雰囲気を演出 */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/30"></div>
        </div>

        {/* メインコンテンツ */}
        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              旅のしおり
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-yellow-400 mx-auto rounded-full mb-8"></div>
          </div>

          <p className="text-xl md:text-2xl mb-12 text-blue-100 leading-relaxed animate-slide-up" style={{animationDelay: '0.3s'}}>
            あなたの旅を、<span className="text-yellow-300 font-semibold">もっと簡単に</span>。<br/>
            思い出を、<span className="text-pink-300 font-semibold">もっと特別に</span>。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: '0.6s'}}>
            <Link
              href="/group/new"
              className="group bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/25 hover:scale-105 flex items-center gap-2"
            >
              <span>今すぐはじめる</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="#features"
              className="text-white border-2 border-white/30 px-10 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              機能を見る
            </Link>
          </div>

          {/* スクロール誘導 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section id="features" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              旅をもっと<span className="text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text">スマートに</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              シンプルで直感的な操作で、あなたの旅行計画を次のレベルへ
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 機能1 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">スマートプランニング</h3>
                <p className="text-gray-600 leading-relaxed">
                  AIが提案する最適なルートで、行きたい場所を効率よく巡る旅行プランを簡単作成
                </p>
              </div>
            </div>

            {/* 機能2 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">リアルタイム共有</h3>
                <p className="text-gray-600 leading-relaxed">
                  友達や家族とリアルタイムで旅行プランを共有・編集。みんなでワクワクを共有
                </p>
              </div>
            </div>

            {/* 機能3 */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
              <div className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">インタラクティブマップ</h3>
                <p className="text-gray-600 leading-relaxed">
                  美しいマップ上で旅行ルートを視覚的に確認。目的地間の移動も一目瞭然
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-cyan-500 to-teal-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
          <h2 className="text-5xl font-bold mb-8 leading-tight">
            次の旅を<br/>
            <span className="text-transparent bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text">今すぐ計画しよう</span>
          </h2>
          <p className="text-xl mb-12 text-blue-100 max-w-2xl mx-auto leading-relaxed">
            簡単な操作で、忘れられない思い出づくりを今すぐ始めませんか？
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/group/new"
              className="group bg-white text-blue-600 px-12 py-5 rounded-full text-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/25 hover:scale-105 flex items-center gap-3"
            >
              <span>無料で始める</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              旅のしおり
            </h2>
            <p className="text-gray-400 text-lg mb-8">あなたの旅をもっと楽しく、もっと便利に</p>

            <div className="flex justify-center space-x-8 mb-8">
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                お問い合わせ
              </Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-gray-500">© {new Date().getFullYear()} 旅のしおり All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default page;