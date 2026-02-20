"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { INSERT_GROUP, INSERT_ITINERARY } from '@/graphql/mutates';
import { regions, prefectures } from '@/data/countries';
import LoadingAirplane from '@/components/LoadingAirplane';

export default function Group() {
  const router = useRouter();
  const [insertGroup, { loading: groupLoading }] = useMutation(INSERT_GROUP);
  const [insertItinerary, { loading: itineraryLoading }] = useMutation(INSERT_ITINERARY);
  const isSubmitting = groupLoading || itineraryLoading;
  const [tripType, setTripType] = useState('domestic');
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purposes, setPurposes] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [prefectureSearch, setPrefectureSearch] = useState('');

  const allCountries = regions.flatMap(r => r.countries);

  const countrySuggestions = countrySearch
    ? allCountries.filter(
        c => c.includes(countrySearch) && !selectedCountries.includes(c)
      )
    : [];

  const prefectureSuggestions = prefectureSearch
    ? prefectures.filter(
        p => p.includes(prefectureSearch) && !selectedPrefectures.includes(p)
      )
    : [];

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

              {/* 都道府県選択（タグ入力） */}
              {tripType === 'domestic' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訪問する都道府県を入力（複数選択可）
                  </label>
                  {/* 選択済みタグ */}
                  {selectedPrefectures.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedPrefectures.map((prefecture) => (
                        <span
                          key={prefecture}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {prefecture}
                          <button
                            type="button"
                            onClick={() => handlePrefectureChange(prefecture)}
                            className="text-blue-500 hover:text-blue-700 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 入力欄 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="都道府県名を入力..."
                      value={prefectureSearch}
                      onChange={(e) => setPrefectureSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {/* サジェスト候補 */}
                    {prefectureSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {prefectureSuggestions.map((prefecture) => (
                          <li
                            key={prefecture}
                            onClick={() => {
                              handlePrefectureChange(prefecture);
                              setPrefectureSearch('');
                            }}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                          >
                            {prefecture}
                          </li>
                        ))}
                      </ul>
                    )}
                    {prefectureSearch && prefectureSuggestions.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <p className="px-4 py-2 text-sm text-gray-500">該当する都道府県が見つかりません</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 国選択（タグ入力） */}
              {tripType === 'overseas' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    訪問する国を入力（複数選択可）
                  </label>
                  {/* 選択済みタグ */}
                  {selectedCountries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedCountries.map((country) => (
                        <span
                          key={country}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {country}
                          <button
                            type="button"
                            onClick={() => handleCountryChange(country)}
                            className="text-blue-500 hover:text-blue-700 font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* 入力欄 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="国名を入力..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {/* サジェスト候補 */}
                    {countrySuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {countrySuggestions.map((country) => (
                          <li
                            key={country}
                            onClick={() => {
                              handleCountryChange(country);
                              setCountrySearch('');
                            }}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                          >
                            {country}
                          </li>
                        ))}
                      </ul>
                    )}
                    {countrySearch && countrySuggestions.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <p className="px-4 py-2 text-sm text-gray-500">該当する国が見つかりません</p>
                      </div>
                    )}
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

            {/* 送信ボタン */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
              >
                {isSubmitting ? <LoadingAirplane /> : 'しおり作りを開始'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}