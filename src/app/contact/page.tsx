import Link from 'next/link';

const ContactPage = () => {
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
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">お問い合わせ</h1>
          <p className="text-xl text-gray-600">
            ご質問やご要望がございましたら、お気軽にお問い合わせください
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <iframe
            src="https://forms.gle/Rmiw5QnzkTssa19b6"
            width="100%"
            height="800"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="お問い合わせフォーム"
          >
            読み込んでいます…
          </iframe>
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

export default ContactPage;
