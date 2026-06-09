"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GoogleMap, Marker } from '@react-google-maps/api';
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
  lat: 35.6762,
  lng: 139.6503
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  const shouldSkipQueries = !itinerary_id;

  const { data: activitiesData, loading, error } = useQuery(GET_ACTIVITIES, {
    variables: { itinerary_id },
    skip: shouldSkipQueries
  });

  useEffect(() => {
    if (isNewGroup && groupToken) {
      const storedActivities = localStorage.getItem(`activities_${groupToken}`);
      if (storedActivities) {
        setLocalActivities(JSON.parse(storedActivities));
      }
    }
  }, [isNewGroup, groupToken]);

  useEffect(() => {
    const activities = itinerary_id && activitiesData?.activities
      ? activitiesData.activities
      : (isNewGroup ? localActivities : (activitiesData?.activities || []));

    if (activities.length > 0) {
      const grouped: {[key: number]: Activity[]} = {};
      const baseDate = isNewGroup && groupData
        ? new Date(groupData.startDate)
        : new Date(Math.min(...activities.map((a: Activity) => new Date(a.date).getTime())));

      activities.forEach((activity: Activity) => {
        const activityDate = new Date(activity.date);
        const dayNumber = Math.floor((activityDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (!grouped[dayNumber]) grouped[dayNumber] = [];
        if (activity.lat && activity.lng) grouped[dayNumber].push(activity);
      });

      setActivitiesByDay(grouped);
    } else {
      setActivitiesByDay({});
    }
  }, [activitiesData, localActivities, isNewGroup, groupData, itinerary_id]);

  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // 選択された日のアクティビティを時間順にソート
  const sortedActivities = (activitiesByDay[selectedDay] || [])
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  const fitBoundsToActivities = useCallback(() => {
    if (!map || sortedActivities.length === 0) return;
    if (sortedActivities.length === 1) {
      map.setCenter({ lat: sortedActivities[0].lat!, lng: sortedActivities[0].lng! });
      map.setZoom(14);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      sortedActivities.forEach(a => bounds.extend({ lat: a.lat!, lng: a.lng! }));
      const isMobile = window.innerWidth < 768;
      // カードストリップの高さ分だけ余白を追加
      map.fitBounds(bounds, { top: isMobile ? 60 : 80, bottom: 200, left: 40, right: 40 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedDay, activitiesByDay]);

  useEffect(() => {
    if (map && activitiesByDay[selectedDay]) {
      setTimeout(fitBoundsToActivities, 100);
    }
  }, [selectedDay, activitiesByDay, fitBoundsToActivities, map]);

  // 日付が変わったら選択をリセット
  useEffect(() => {
    setSelectedActivity(null);
  }, [selectedDay]);

  // 選択が変わったらカードをスクロールして中央に表示
  useEffect(() => {
    if (!selectedActivity) return;
    const card = cardRefs.current[selectedActivity.id];
    const container = scrollContainerRef.current;
    if (card && container) {
      const cardLeft = card.offsetLeft;
      const cardWidth = card.offsetWidth;
      const containerWidth = container.offsetWidth;
      container.scrollTo({
        left: cardLeft - (containerWidth - cardWidth) / 2,
        behavior: 'smooth',
      });
    }
  }, [selectedActivity]);

  // カードをクリック → マップをパン＆ズーム
  const handleCardClick = (activity: Activity) => {
    setSelectedActivity(activity);
    if (map && activity.lat && activity.lng) {
      map.panTo({ lat: activity.lat, lng: activity.lng });
      map.setZoom(13);
      // カードストリップ分だけ上にずらす
      setTimeout(() => map.panBy(0, 60), 50);
    }
  };

  // ピンをクリック → カードを選択してスクロール
  const handleMarkerClick = (activity: Activity) => {
    setSelectedActivity(activity);
    if (map && activity.lat && activity.lng) {
      map.panTo({ lat: activity.lat, lng: activity.lng });
      setTimeout(() => map.panBy(0, 80), 50);
    }
  };

  const getMarkerColor = (type: string) => {
    const colors: {[key: string]: string} = {
      transport: '#3B82F6',
      sightseeing: '#10B981',
      restaurant: '#F59E0B',
      hotel: '#8B5CF6',
      activity: '#EF4444',
      area: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  const createNumberedMarkerIcon = (number: number, type: string, selected: boolean) => {
    const color = getMarkerColor(type);
    const size = selected ? 38 : 30;
    const fontSize = selected ? 14 : 12;
    const svg = `
      <svg width="${size}" height="${Math.round(size * 4/3)}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}" stroke="${selected ? 'white' : 'none'}" stroke-width="${selected ? 2 : 0}"/>
        <circle cx="15" cy="15" r="12" fill="white"/>
        <text x="15" y="15" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}">${number}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const createCurrentLocationIcon = () => {
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const handleRecenterToCurrentLocation = useCallback(() => {
    if (map && currentLocation) {
      map.panTo(currentLocation);
      map.setZoom(15);
    }
  }, [map, currentLocation]);

  if (!isNewGroup && loading) {
    return <LoadingAirplane fullPage message="アクティビティを読み込み中..." />;
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

  return (
    <div className="w-full h-full relative">

      {/* マップ */}
      <div className="w-full h-full">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={10}
            onLoad={onLoad}
            onClick={() => setSelectedActivity(null)}
          >
            {currentLocation && (
              <Marker
                position={currentLocation}
                title="現在地"
                icon={createCurrentLocationIcon()}
                zIndex={1000}
              />
            )}

            {sortedActivities.map((activity, index) => (
              <Marker
                key={activity.id}
                position={{ lat: activity.lat!, lng: activity.lng! }}
                onClick={() => handleMarkerClick(activity)}
                title={`${index + 1}. ${activity.name}`}
                icon={createNumberedMarkerIcon(index + 1, activity.type, selectedActivity?.id === activity.id)}
                zIndex={selectedActivity?.id === activity.id ? 100 : 1}
              />
            ))}
          </GoogleMap>
        ) : (
          <LoadingAirplane fullPage message="マップを読み込み中..." />
        )}
      </div>

      {/* 現在地ボタン */}
      {currentLocation && (
        <button
          onClick={handleRecenterToCurrentLocation}
          className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
          title="現在地を表示"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </button>
      )}

      {/* 下部アクティビティ横スクロールストリップ */}
      {sortedActivities.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/20 to-transparent pt-6">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-3 pt-1 px-3 scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {sortedActivities.map((activity, index) => {
              const isSelected = selectedActivity?.id === activity.id;
              return (
                <div
                  key={activity.id}
                  ref={el => { cardRefs.current[activity.id] = el; }}
                  onClick={() => handleCardClick(activity)}
                  className={`flex-shrink-0 w-48 bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-xl scale-[1.03]'
                      : 'hover:shadow-xl hover:scale-[1.01]'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  {/* 写真 or カラーバー */}
                  {activity.photo_url ? (
                    <div className="relative h-24 w-full">
                      <ActivityImage
                        src={activity.photo_url}
                        alt={activity.name}
                        placeId={activity.place_id}
                        fill
                        className="object-cover"
                      />
                      {/* 番号バッジ */}
                      <div
                        className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                        style={{ backgroundColor: getMarkerColor(activity.type) }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: getMarkerColor(activity.type) }}
                    />
                  )}

                  {/* テキスト */}
                  <div className="p-2.5">
                    {/* 番号 + 名前（写真なし時） */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {!activity.photo_url && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: getMarkerColor(activity.type) }}
                        >
                          {index + 1}
                        </div>
                      )}
                      <p className="font-semibold text-sm text-gray-800 truncate leading-tight">
                        {activity.name}
                      </p>
                    </div>
                    {/* 時刻 */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{activity.time.slice(0, 5)}</span>
                    </div>
                    {/* 場所（1行） */}
                    {activity.location && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{activity.location}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default MapContent;
