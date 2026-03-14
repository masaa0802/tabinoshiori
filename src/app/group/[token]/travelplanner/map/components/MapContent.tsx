"use client";

import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GoogleMap, Marker, OverlayView } from '@react-google-maps/api';
import { GET_ACTIVITIES } from '@/graphql/queries';
import { useGoogleMaps } from '@/components/GoogleMapsProvider';
import LoadingAirplane from '@/components/LoadingAirplane';
import ActivityImage from '@/components/ActivityImage';

interface Activity {
  id: number;
  name: string;
  location: string;
  lat?: number;
  lng?: number;
  type: string;
  date: string;
  time: string;
  notes?: string;
  photo_url?: string;
  place_id?: string;
}

interface GroupData {
  groupName: string;
  tripType: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  purposes: string[];
  createdAt: string;
  token: string;
}

interface MapContentProps {
  selectedDay?: number;
  groupToken?: string;
  isNewGroup?: boolean;
  groupData?: GroupData | null;
  itinerary_id?: number;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 35.6762, // 東京の緯度
  lng: 139.6503 // 東京の経度
};

const MapContent: React.FC<MapContentProps> = ({
  selectedDay = 1,
  groupToken,
  isNewGroup = false,
  groupData,
  itinerary_id
}) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activitiesByDay, setActivitiesByDay] = useState<{[key: number]: Activity[]}>({});
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // itinerary_idがある場合は常にクエリを実行
  // itinerary_idがない場合のみスキップ
  const shouldSkipQueries = !itinerary_id;

  const { data: activitiesData, loading, error } = useQuery(GET_ACTIVITIES, {
    variables: { itinerary_id },
    skip: shouldSkipQueries
  });

  // 新しいグループの場合、localStorageからアクティビティを読み込み
  useEffect(() => {
    if (isNewGroup && groupToken) {
      const storedActivities = localStorage.getItem(`activities_${groupToken}`);
      if (storedActivities) {
        const activities = JSON.parse(storedActivities);
        setLocalActivities(activities);
      }
    }
  }, [isNewGroup, groupToken]);

  // アクティビティデータを日付別に整理
  useEffect(() => {
    // itinerary_idがある場合は常にactivitiesDataを使用
    // localActivitiesはitinerary_idがない場合のみ使用
    const activities = itinerary_id && activitiesData?.activities
      ? activitiesData.activities
      : (isNewGroup ? localActivities : (activitiesData?.activities || []));

    if (activities.length > 0) {
      const grouped: {[key: number]: Activity[]} = {};

      // 新しいグループの場合は、グループの開始日を基準に日数を計算
      const baseDate = isNewGroup && groupData
        ? new Date(groupData.startDate)
        : new Date(Math.min(...activities.map((a: Activity) => new Date(a.date).getTime())));

      activities.forEach((activity: Activity) => {
        const activityDate = new Date(activity.date);
        const dayNumber = Math.floor((activityDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (!grouped[dayNumber]) {
          grouped[dayNumber] = [];
        }

        // 緯度・経度がある場合のみ追加
        if (activity.lat && activity.lng) {
          grouped[dayNumber].push(activity);
        }
      });

      setActivitiesByDay(grouped);
    } else {
      setActivitiesByDay({});
    }
  }, [activitiesData, localActivities, isNewGroup, groupData, itinerary_id]);

  const { isLoaded } = useGoogleMaps();

  // 現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('位置情報の取得に失敗しました:', error);
        }
      );
    }
  }, []);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // 選択された日のアクティビティに合わせてマップの表示範囲を調整
  const fitBoundsToActivities = useCallback(() => {
    if (!map || !activitiesByDay[selectedDay] || activitiesByDay[selectedDay].length === 0) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    activitiesByDay[selectedDay].forEach(activity => {
      if (activity.lat && activity.lng) {
        bounds.extend(new window.google.maps.LatLng(activity.lat, activity.lng));
      }
    });

    // スマホかどうかを判定
    const isMobile = window.innerWidth < 768;
    // スマホの場合はより大きなパディングを設定
    const padding = isMobile ? 80 : 100;

    // アクティビティが1つの場合は適切なズームレベルを設定
    if (activitiesByDay[selectedDay].length === 1) {
      const activity = activitiesByDay[selectedDay][0];
      map.setCenter({ lat: activity.lat!, lng: activity.lng! });
      map.setZoom(14);
    } else {
      // 複数のアクティビティがある場合は全て表示
      map.fitBounds(bounds, padding);
    }
  }, [map, selectedDay, activitiesByDay]);

  // selectedDayまたはactivitiesByDayが変更された時にfitBoundsを実行
  useEffect(() => {
    if (map && activitiesByDay[selectedDay]) {
      // 少し遅延させてマーカーが描画されてから実行
      setTimeout(() => {
        fitBoundsToActivities();
      }, 100);
    }
  }, [selectedDay, activitiesByDay, fitBoundsToActivities, map]);

  const handleMarkerClick = (activity: Activity) => {
    setSelectedActivity(activity);
    if (map && activity.lat && activity.lng) {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        map.panTo({ lat: activity.lat, lng: activity.lng });
        // カードの高さ分だけマーカーを上にずらして見えるようにする
        setTimeout(() => map.panBy(0, 90), 50);
      }
    }
  };

  // アクティビティタイプに基づくマーカーの色を取得
  const getMarkerColor = (type: string) => {
    const colors: {[key: string]: string} = {
      'transport': '#3B82F6', // 青
      'sightseeing': '#10B981', // 緑
      'restaurant': '#F59E0B', // オレンジ
      'hotel': '#8B5CF6', // 紫
      'activity': '#EF4444', // 赤
      'area': '#6B7280', // グレー
    };
    return colors[type] || '#6B7280';
  };

  // 番号付きマーカーのSVGアイコンを生成
  const createNumberedMarkerIcon = (number: number, type: string) => {
    const color = getMarkerColor(type);
    const svg = `
      <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
        <circle cx="15" cy="15" r="12" fill="white"/>
        <text x="15" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${color}">${number}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // 現在地マーカーのアイコンを生成
  const createCurrentLocationIcon = () => {
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // アクティビティタイプの日本語表示
  const getTypeLabel = (type: string) => {
    const typeLabels: {[key: string]: string} = {
      'transport': '交通',
      'sightseeing': '観光スポット',
      'restaurant': '飲食店',
      'hotel': 'ホテル',
      'activity': 'アクティビティ',
      'area': 'エリア',
    };
    return typeLabels[type] || type;
  };

  // 現在地にマップを移動
  const handleRecenterToCurrentLocation = useCallback(() => {
    if (map && currentLocation) {
      map.panTo(currentLocation);
      map.setZoom(15);
    }
  }, [map, currentLocation]);

  // 新しいグループで読み込み中、または既存グループでGraphQL読み込み中の場合
  if (!isNewGroup && loading) {
    return (
      <LoadingAirplane fullPage message="アクティビティを読み込み中..." />
    );
  }

  if (!isNewGroup && error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>アクティビティの読み込みに失敗しました</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const selectedIndex = selectedActivity
    ? (activitiesByDay[selectedDay]?.sort((a, b) => a.time.localeCompare(b.time)).findIndex(a => a.id === selectedActivity.id) ?? -1) + 1
    : 0;

  return (
    <div className="w-full h-full relative">
      {/* 現在地ボタン */}
      {currentLocation && (
        <button
          onClick={handleRecenterToCurrentLocation}
          className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          title="現在地を表示"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 text-blue-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
        </button>
      )}

      {/* スマホ用コンパクトカード */}
      {selectedActivity && (
        <div className="sm:hidden fixed bottom-16 left-3 right-3 z-40 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-stretch">
            {/* サムネイル画像 */}
            {selectedActivity.photo_url ? (
              <div className="flex-shrink-0 w-24">
                <ActivityImage
                  src={selectedActivity.photo_url}
                  alt={selectedActivity.name}
                  placeId={selectedActivity.place_id}
                  width={200}
                  height={200}
                  className="w-24 h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex-shrink-0 w-2 rounded-l-2xl"
                style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
              />
            )}

            {/* テキストコンテンツ */}
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
                  >
                    {selectedIndex}
                  </div>
                  <h3 className="font-bold text-sm leading-tight truncate">{selectedActivity.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm"
                >
                  ×
                </button>
              </div>

              {selectedActivity.location && (
                <p className="text-xs text-gray-500 mt-1 truncate pl-8">{selectedActivity.location}</p>
              )}

              <div className="flex gap-2 mt-2 flex-wrap pl-8">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
                >
                  {getTypeLabel(selectedActivity.type)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{selectedActivity.time.slice(0, 5)}
                </span>
              </div>

              {selectedActivity.notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 pl-8">{selectedActivity.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* マップ */}
      <div className="w-full h-full">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={10}
            onLoad={onLoad}
          >
            {/* 現在地マーカー */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                title="現在地"
                icon={createCurrentLocationIcon()}
                zIndex={1000}
              />
            )}

            {/* 順番でソートされたアクティビティのマーカー */}
            {activitiesByDay[selectedDay]
              ?.sort((a, b) => a.time.localeCompare(b.time))
              .map((activity, index) => (
                <Marker
                  key={activity.id}
                  position={{ lat: activity.lat!, lng: activity.lng! }}
                  onClick={() => handleMarkerClick(activity)}
                  title={`${index + 1}. ${activity.name} (${activity.time})`}
                  icon={createNumberedMarkerIcon(index + 1, activity.type)}
                />
              ))}

            {/* PC用OverlayView */}
            {selectedActivity && (
              <OverlayView
                position={{ lat: selectedActivity.lat!, lng: selectedActivity.lng! }}
                mapPaneName='overlayMouseTarget'
              >
                <div className="hidden sm:block relative bg-white rounded-xl shadow-2xl border border-gray-100 w-72 transform -translate-x-1/2 -translate-y-full mb-3">
                  {/* 閉じるボタン */}
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white text-sm z-10 transition-colors"
                  >
                    ×
                  </button>

                  {/* 画像 */}
                  {selectedActivity.photo_url ? (
                    <ActivityImage
                      src={selectedActivity.photo_url}
                      alt={selectedActivity.name}
                      placeId={selectedActivity.place_id}
                      width={400}
                      height={160}
                      className="w-full h-32 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div
                      className="w-full h-10 rounded-t-xl"
                      style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
                    />
                  )}

                  {/* コンテンツ */}
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow"
                        style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
                      >
                        {activitiesByDay[selectedDay]
                          ?.sort((a, b) => a.time.localeCompare(b.time))
                          .findIndex(activity => activity.id === selectedActivity.id) + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm leading-tight">{selectedActivity.name}</h3>
                        {selectedActivity.location && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{selectedActivity.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getMarkerColor(selectedActivity.type) }}
                      >
                        {getTypeLabel(selectedActivity.type)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{selectedActivity.time.slice(0, 5)}
                      </span>
                    </div>

                    {selectedActivity.notes && (
                      <p className="text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-2">{selectedActivity.notes}</p>
                    )}
                  </div>

                  {/* 吹き出しの三角形 */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}></div>
                  </div>
                </div>
              </OverlayView>
            )}
          </GoogleMap>
        ) : (
          <LoadingAirplane fullPage message="マップを読み込み中..." />
        )}
      </div>
    </div>
  );
};

export default MapContent;