"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { INSERT_GROUP, INSERT_ITINERARY } from '@/graphql/mutates';

export default function Group() {
  const router = useRouter();
  const [insertGroup] = useMutation(INSERT_GROUP);
  const [insertItinerary] = useMutation(INSERT_ITINERARY);
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [tripType, setTripType] = useState('domestic');
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purposes, setPurposes] = useState<string[]>([]);


  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  const countries = [
    'アメリカ', 'イギリス', 'フランス', 'イタリア', 'スペイン', 'ドイツ',
    'オーストラリア', '韓国', '中国', 'タイ', 'シンガポール', 'マレーシア',
    'インドネシア', 'ベトナム', 'カナダ', 'メキシコ', 'ブラジル', 'エジプト',
    'トルコ', 'インド', 'ニュージーランド'
  ];

  const handleAddParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleTripTypeChange = (type: string) => {
    setTripType(type);
    setSelectedPrefectures([]);
    setSelectedCountries([]);
  };

  const handlePrefectureChange = (prefecture: string) => {
    setSelectedPrefectures(prev => 
      prev.includes(prefecture)
        ? prev.filter(p => p !== prefecture)
        : [...prev, prefecture]
    );
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const handlePurposeChange = (purpose: string) => {
    setPurposes(prev =>
      prev.includes(purpose)
        ? prev.filter(p => p !== purpose)
        : [...prev, purpose]
    );
  };

  const generateGroupToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!groupName.trim()) {
      alert('グループ名を入力してください');
      return;
    }
    if (!startDate || !endDate) {
      alert('出発日と帰着日を入力してください');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      alert('帰着日は出発日より後の日付を選択してください');
      return;
    }

    try {
      // グループトークン生成
      const token = generateGroupToken();

      // グループをデータベースに保存
      const { data: groupData } = await insertGroup({
        variables: {
          name: groupName.trim(),
          token: token,
        },
      });

      if (!groupData?.insert_groups?.returning?.[0]) {
        throw new Error('グループの作成に失敗しました');
      }

      const groupId = groupData.insert_groups.returning[0].id;

      // 旅程をデータベースに保存
      const destinations = tripType === 'domestic' ? selectedPrefectures : selectedCountries;
      const { data: itineraryData } = await insertItinerary({
        variables: {
          group_id: groupId,
          title: groupName.trim(),
          destination: destinations.join(', '), // 配列を文字列に変換
          start_date: startDate,
          end_date: endDate,
          travel_purpose: purposes.join(', '), // 配列を文字列に変換
          location_type: tripType,
        },
      });

      if (!itineraryData?.insert_itineraries?.returning?.[0]) {
        throw new Error('旅程の作成に失敗しました');
      }

      const itineraryId = itineraryData.insert_itineraries.returning[0].id;

      // しおり作成画面に遷移
      router.push(`/group/${token}/travelplanner/${itineraryId}`);
    } catch (error) {
      console.error('エラーが発生しました:', error);
      alert('データの保存に失敗しました。もう一度お試しください。');
    }
  };

  return ( 
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/images/header_logo-removebg-preview.png" alt='ヘッダー画像' width={120} height={100}/>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* ヘッダー画像 */}
          <div className="relative h-40 w-full">
            <Image
              src="/images/hawai.jpg"
              alt="旅行の雰囲気を表す画像"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <h2 className="text-white text-2xl font-bold p-6">新しい旅のグループを作成</h2>
            </div>
          </div>

          {/* フォーム */}
          <form className="p-6 space-y-8" onSubmit={handleSubmit}>
            {/* グループ名 */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                グループ名
              </label>
              <input
                type="text"
                id="groupName"
                name="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例：フロリダディズニー家族旅行、大学の友人とヨーロッパ卒業旅行"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 国内・海外 */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                旅行先
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tripType"
                    value="domestic"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={tripType === 'domestic'}
                    onChange={(e) => handleTripTypeChange(e.target.value)}
                  />
                  <span className="ml-2">国内</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tripType"
                    value="overseas"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    checked={tripType === 'overseas'}
                    onChange={(e) => handleTripTypeChange(e.target.value)}
                  />
                  <span className="ml-2">海外</span>
                </label>
              </div>

              {/* 都道府県選択 */}
              {tripType === 'domestic' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訪問する都道府県を選択（複数選択可）
                  </label>
                  <div className="grid grid-cols-4 gap-2 p-4 border rounded-md bg-white max-h-60 overflow-y-auto">
                    {prefectures.map((prefecture) => (
                      <label key={prefecture} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPrefectures.includes(prefecture)}
                          onChange={() => handlePrefectureChange(prefecture)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{prefecture}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 国選択 */}
              {tripType === 'overseas' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訪問する国を選択（複数選択可）
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-4 border rounded-md bg-white max-h-60 overflow-y-auto">
                    {countries.map((country) => (
                      <label key={country} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country)}
                          onChange={() => handleCountryChange(country)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 滞在期間 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  出発日
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  帰着日
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 旅の目的 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                旅の目的（複数選択可）
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="accommodation"
                    checked={purposes.includes('accommodation')}
                    onChange={() => handlePurposeChange('accommodation')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">宿泊場所の雰囲気を楽しみたい</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="relaxation"
                    checked={purposes.includes('relaxation')}
                    onChange={() => handlePurposeChange('relaxation')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">のんびり過ごす</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="newAtmosphere"
                    checked={purposes.includes('newAtmosphere')}
                    onChange={() => handlePurposeChange('newAtmosphere')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">日常と違う雰囲気を味わう</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="scenery"
                    checked={purposes.includes('scenery')}
                    onChange={() => handlePurposeChange('scenery')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">風景・景色を楽しみたい</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="refresh"
                    checked={purposes.includes('refresh')}
                    onChange={() => handlePurposeChange('refresh')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">リフレッシュ・気分転換したい</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="sightseeing"
                    checked={purposes.includes('sightseeing')}
                    onChange={() => handlePurposeChange('sightseeing')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">観光地や名所を巡りたい</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="food"
                    checked={purposes.includes('food')}
                    onChange={() => handlePurposeChange('food')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">旅先の食べ物を堪能したい</span>
                </label>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="purpose"
                    value="other"
                    checked={purposes.includes('other')}
                    onChange={() => handlePurposeChange('other')}
                    className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">その他</span>
                </label>
              </div>
            </div>
            {/* ヒント */}
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">💡<b>ヒント</b></h3>
              <p className="text-sm text-blue-700 mt-1">
                目的や好みを選択すると、あなたの旅行に合わせたおすすめスポットが表示されます。
                より詳細な情報を入力すると、よりパーソナライズされた旅のプランを提案できます。
              </p>
            </div>

            {/* 参加者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                参加者
              </label>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="名前を入力"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button 
                  type="button" 
                  onClick={handleAddParticipant}
                  className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
                >
                  追加
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between p-2 border-b">
                  <span>あなた（作成者）</span>
                </div>
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border-b">
                    <span>{participant}</span>
                    <button
                      type="button"
                      onClick={() => setParticipants(participants.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 font-light"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                ※参加者はあとからでも追加できます
              </p>
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors duration-300"
              >
                しおり作りを開始
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}