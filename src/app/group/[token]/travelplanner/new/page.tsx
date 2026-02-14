"use client";

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import MapPage from '../map/page';
import { GET_GROUP } from '@/graphql/queries';
import {
  MapPin,
  ThumbsUp,
  Clock3,
  Coffee,
  Camera,
  Navigation,
  Map as MapIcon,
  Utensils,
  Hotel,
  Sunrise,
  Globe,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  Tag,
  Search,
  Filter
} from 'lucide-react';

interface TripInfo {
  destination: string;
  startDate: string;
  endDate: string;
  participants: string[];
  days: number;
}

interface Activity {
  time: string;
  type: string;
  name: string;
  notes?: string;
}

interface DayPlan {
  day: number;
  activities: Activity[];
}

interface Suggestion {
  type: string;
  name: string;
  photo: string;
  rating: number;
  distance?: string;
  price?: string;
  visitTime?: string;
  bestTime?: string;
  description: string;
  tags?: string[];
}

export default function TravelPlanner() {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedDay, setSelectedDay] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recommendationType, setRecommendationType] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentActivity] = useState<Activity | null>(null);
  const { data: queryData } = useQuery(GET_GROUP);

  console.log(queryData);

  // 時間フォーマット関数（HH:MM:SS -> HH:MM）
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM:SS から HH:MM を取得
  };

  // サンプルデータ
  const tripInfo: TripInfo = {
    destination: '京都',
    startDate: '2024-04-01',
    endDate: '2024-04-03',
    participants: ['山田太郎', '鈴木花子'],
    days: 3
  };

  // AIおすすめカテゴリとデータ
  const aiRecommendationCategories = [
    { id: 'nearby', name: '近くのスポット', icon: <MapPin size={16} /> },
    { id: 'popular', name: '人気スポット', icon: <ThumbsUp size={16} /> },
    { id: 'timeframe', name: '時間帯にぴったり', icon: <Clock3 size={16} /> },
    { id: 'local', name: '地元の穴場', icon: <Coffee size={16} /> },
    { id: 'photo', name: '写真映えスポット', icon: <Camera size={16} /> }
  ];

  // サンプルの旅程データ
  const itinerary: DayPlan[] = [
    {
      day: 1,
      activities: [
        { time: '09:00', type: 'transport', name: '京都駅到着', notes: 'JR新幹線' },
        { time: '10:00', type: 'sightseeing', name: '清水寺', notes: '拝観料1000円' }
      ]
    }
  ];

  // アクティビティタイプに応じたアイコン取得
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport': return <Navigation className="text-blue-500" size={16} />;
      case 'sightseeing': return <MapIcon className="text-green-500" size={16} />;
      case 'restaurant': return <Utensils className="text-orange-500" size={16} />;
      case 'hotel': return <Hotel className="text-purple-500" size={16} />;
      case 'activity': return <Sunrise className="text-yellow-500" size={16} />;
      case 'area': return <Globe className="text-indigo-500" size={16} />;
      default: return <Clock className="text-gray-500" size={16} />;
    }
  };

  // おすすめ情報の取得（サンプル）
  const getRecommendations = (): Suggestion[] => {
    return [
      {
        type: 'sightseeing',
        name: '金閣寺',
        photo: '/images/hawai.jpg',
        rating: 4.8,
        distance: '2.5km',
        price: '¥400',
        visitTime: '1時間',
        description: '京都を代表する金色の寺院。美しい庭園と池の景色が魅力。',
        tags: ['世界遺産', '寺院', '庭園']
      }
    ];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* タブナビゲーション */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container ml-4 flex">
        <div className="max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/images/header_logo-removebg-preview.png" alt='ヘッダー画像' width={120} height={100}/>
          </Link>
        </div>
          <button 
            className={`px-4 py-3 font-bold ${activeTab === 'plan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('plan')}
          >
            旅行プラン
          </button>
          <button 
            className={`px-4 py-3 font-bold ${activeTab === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('map')}
          >
            マップ
          </button>
          <button 
            className={`px-4 py-3 font-bold ${activeTab === 'budget' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('budget')}
          >
            予算
          </button>
          <button 
            className={`px-4 py-3 font-bold ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('settings')}
          >
            設定
          </button>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
            {/* 左サイドバー：日程選択 */}
            <div className="w-48 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h2 className="font-semibold text-gray-700 mb-2">日程</h2>
                <div className="space-y-1">
                  {Array.from({ length: tripInfo.days }, (_, i) => (
                    <button
                      key={i}
                      className={`w-full text-left px-3 py-2 rounded-md ${selectedDay === i + 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                      onClick={() => setSelectedDay(i + 1)}
                    >
                      {i + 1}日目
                    </button>
                  ))}
                </div>
              </div>
              
            </div>
            {activeTab === 'map' ? (
          <MapPage />
        ) : (
          <>
            {/* メインエリア：日程詳細 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{selectedDay}日目</h2>
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? '完了' : '編集'}
                  </button>
                </div>

                {/* タイムライン */}
                <div className="space-y-6">
                  {itinerary.find(day => day.day === selectedDay)?.activities.map((activity, index) => (
                    <div key={index} className="flex group">
                      {/* 時間列 */}
                      <div className="w-20 pt-1 text-right pr-4 text-gray-500 font-medium">
                        {formatTime(activity.time)}
                      </div>
                      
                      {/* タイムラインの縦線 */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 aspect-square flex-shrink-0"></div>
                        {index < (itinerary.find(day => day.day === selectedDay)?.activities?.length ?? 0) - 1 && (
                          <div className="w-px bg-gray-300 h-full"></div>
                        )}
                      </div>
                      
                      {/* 内容 */}
                      <div className="ml-4 bg-white rounded-lg border border-gray-200 p-4 flex-1 shadow-sm group-hover:shadow">
                        <div className="flex justify-between">
                          <div className="flex items-start">
                            <div className="mr-3">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">{activity.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">{activity.notes}</p>
                            </div>
                          </div>
                          {editMode && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* アクティビティ追加ボタン */}
                    <div className="flex">
                      <div className="w-20"></div>
                      <div className="relative flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      </div>
                      <button className="ml-4 border border-dashed border-gray-300 rounded-lg p-4 flex-1 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                        <span className="text-blue-600">+ アクティビティを追加</span>
                      </button>
                    </div>
                </div>
              </div>
            </div>

            {/* サイドバー開閉ボタン */}
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-md shadow-md"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* 右サイドバー：AIおすすめ - 開閉可能 */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300`}>
              {sidebarOpen && (
                <div className="p-4">
                  <h2 className="font-semibold text-gray-700 mb-2">AIおすすめ</h2>
                  
                  {/* 現在の場所コンテキスト */}
                  {currentActivity && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">{currentActivity.name}</span> 周辺のおすすめです
                      </p>
                    </div>
                  )}
                  
                  {/* 検索バー */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="場所やキーワードを検索..."
                        className="w-full border border-gray-300 rounded-md py-2 pl-8 pr-2 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* AIおすすめカテゴリ */}
                  <div className="mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex space-x-2">
                      {aiRecommendationCategories.map((category) => (
                        <button
                          key={category.id}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                            recommendationType === category.id 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          onClick={() => setRecommendationType(category.id)}
                        >
                          <span className="mr-1">{category.icon}</span>
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* AIフィルター */}
                  <div className="mb-4 flex items-center text-sm">
                    <Filter className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-gray-700 mr-2">フィルター:</span>
                    <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                      <option>すべてのタイプ</option>
                      <option>観光スポット</option>
                      <option>飲食店</option>
                      <option>アクティビティ</option>
                    </select>
                    <button className="ml-auto text-blue-600 text-xs">AI分析</button>
                  </div>
                  
                  {/* おすすめリスト */}
                  <div className="space-y-4">
                    {getRecommendations().map((suggestion, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow cursor-pointer transition-all">
                        <div className="flex">
                          {/* サムネイル画像 */}
                          <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0 mr-3">
                            <Image
                              src={suggestion.photo}
                              alt={suggestion.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-800 flex items-center">
                                  {getActivityIcon(suggestion.type)}
                                  <span className="ml-1">{suggestion.name}</span>
                                </h3>
                                <div className="flex items-center mt-1">
                                  <Star className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs text-gray-600 ml-1">{suggestion.rating}</span>
                                  
                                  {suggestion.distance && (
                                    <span className="text-xs text-gray-500 ml-2">• {suggestion.distance}</span>
                                  )}
                                  
                                  {suggestion.price && (
                                    <span className="text-xs text-gray-600 ml-2">{suggestion.price}</span>
                                  )}
                                  
                                  {suggestion.visitTime && (
                                    <span className="text-xs text-gray-500 ml-2">• {suggestion.visitTime}</span>
                                  )}
                                  
                                  {suggestion.bestTime && (
                                    <span className="text-xs text-gray-500 ml-2">• {suggestion.bestTime}</span>
                                  )}
                                </div>
                              </div>
                              <button className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                追加
                              </button>
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{suggestion.description}</p>
                            
                            {/* タグ */}
                            {suggestion.tags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.tags.map((tag, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                    <Tag className="w-2 h-2 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* AIパーソナライズド提案 */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                      <span className="mr-2">✨</span>
                      あなただけのAI提案
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      現在の旅程分析から、以下のプランをおすすめします：
                    </p>
                    <div className="bg-white p-3 rounded-md shadow-sm">
                      <h4 className="font-medium text-gray-800">嵐山&rarr;金閣寺&rarr;銀閣寺コース</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        効率的な移動で京都の名所を網羅できるルートです。所要時間は約6時間です。
                      </p>
                      <button className="mt-2 w-full bg-blue-100 text-blue-700 text-xs font-medium py-1 rounded">
                        詳細を見る
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}