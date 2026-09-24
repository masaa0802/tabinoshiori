"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MapContent from "../map/components/MapContent";
import BudgetContent from "../budget/components/BudgetContent";
import InformationContent from "../information/components/InformationContent";
import { GET_ITINERARIES, GET_ITINERARY_BY_TOKEN_AND_ID, GET_ACTIVITIES } from "@/graphql/queries";
import { DELETE_ACTIVITY, INSERT_ITINERARY, INSERT_GROUP } from "@/graphql/mutates";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";
import {
  Navigation,
  Map as MapIcon,
  Utensils,
  Hotel,
  Sunrise,
  Globe,
  Clock,
} from "lucide-react";
import AddActivityModal from "../components/AddActivityModal";
import EditActivityModal from "../components/EditActivityModal";
import EditItineraryDatesModal from "../components/EditItineraryDatesModal";
import ActivityDetailSheet from "../components/ActivityDetailSheet";
import ActivityDetailModal from "../components/ActivityDetailModal";
import LoadingAirplane from "@/components/LoadingAirplane";
import { preloadActivityTypeImages } from "@/lib/activityTypeImage";
import ActivityCardIllustration from "../components/ActivityCardIllustration";

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

interface TripInfo {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
}

interface Activity {
  id: number;
  itinerary_id: number;
  name: string;
  location: string;
  notes?: string;
  type: string;
  date: string;
  time: string;
  photo_url?: string;
  lat?: number;
  lng?: number;
  place_id?: string;
}


interface DayPlan {
  day: number;
  activities: Activity[];
}


export default function TravelPlanner() {
  const params = useParams();
  const groupToken = params.token as string;
  const travelPlannerId = params.travelPlannerId as string;

  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [createdItineraryId, setCreatedItineraryId] = useState<number | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);

  // Only run GraphQL queries for existing groups, or for new groups after itinerary is created
  const shouldSkipQueries = Boolean(isNewGroup && groupData && !createdItineraryId);

  // 既存の旅行プラン（travelPlannerIdがある場合）はtokenと一致するもののみ取得
  const { data: itineraryData, loading: itineraryLoading, error: itineraryError, refetch: refetchItinerary } = useQuery(GET_ITINERARY_BY_TOKEN_AND_ID, {
    variables: { id: parseInt(travelPlannerId), token: groupToken },
    skip: !travelPlannerId || isNewGroup
  });

  // 新規作成時の全itineraries取得（互換性のため残す）
  const { data: itinerariesData, loading, error } = useQuery(GET_ITINERARIES, {
    skip: shouldSkipQueries || !!travelPlannerId
  });

  const { data: activitiesData, refetch: refetchActivities } = useQuery(GET_ACTIVITIES, {
    variables: { itinerary_id: createdItineraryId || parseInt(travelPlannerId) },
    skip: shouldSkipQueries || (!createdItineraryId && !travelPlannerId)
  });
  const [deleteActivity] = useMutation(DELETE_ACTIVITY);
  const [insertItinerary] = useMutation(INSERT_ITINERARY);
  const [insertGroup] = useMutation(INSERT_GROUP);

  const [activeTab, setActiveTab] = useState("plan");
  const [selectedDay, setSelectedDay] = useState(1);
  const [editDatesModalOpen, setEditDatesModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string>("");

  // スワイプ状態管理
  const [swipedActivityId, setSwipedActivityId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);
  // タップ検出用（Y軸移動量と開始時刻で区別）
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchCurrentY, setTouchCurrentY] = useState<number>(0);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  // 詳細シート
  const [selectedActivityForDetail, setSelectedActivityForDetail] = useState<Activity | null>(null);

  // しおり表示時にlocalStorageへ保存（最近作ったしおり用）
  useEffect(() => {
    if (!groupToken || !travelPlannerId) return;
    // itineraryDataのロード完了後に保存
    const itinerary = itineraryData?.itineraries?.[0];
    if (!itinerary) return;
    const existing = localStorage.getItem(`shiori_${groupToken}`);
    let existingCreatedAt: string | undefined;
    if (existing) {
      try { existingCreatedAt = JSON.parse(existing).createdAt; } catch { /* ignore */ }
    }
    const shioriData = {
      token: groupToken,
      itineraryId: parseInt(travelPlannerId),
      groupName: itinerary.title || '',
      destination: itinerary.destination || '',
      startDate: itinerary.start_date || '',
      endDate: itinerary.end_date || '',
      createdAt: existingCreatedAt || new Date().toISOString(),
    };
    localStorage.setItem(`shiori_${groupToken}`, JSON.stringify(shioriData));
  }, [groupToken, travelPlannerId, itineraryData]);

  // Load group data from localStorage if it's a new group
  useEffect(() => {
    if (groupToken) {
      const storedGroupData = localStorage.getItem(`group_${groupToken}`);
      if (storedGroupData) {
        const parsed = JSON.parse(storedGroupData);

        // travelPlannerIdがある場合は既存の旅行プランへのアクセス
        if (travelPlannerId) {
          // localStorageに保存されているitinerary_idと一致するか確認
          if (parsed.createdItineraryId && parsed.createdItineraryId === parseInt(travelPlannerId)) {
            // 同じトークンで作成された旅行プラン
            setGroupData(parsed);
            setIsNewGroup(false);
            setCreatedGroupId(parsed.createdGroupId);
            setCreatedItineraryId(parsed.createdItineraryId);
          } else {
            // 異なるトークンまたは既存の旅行プラン
            setIsNewGroup(false);
          }
          return;
        }

        // travelPlannerIdがない場合は新規作成中
        setGroupData(parsed);
        setIsNewGroup(true);

        // 既に作成済みのIDがあればそれを使用
        if (parsed.createdGroupId) {
          console.log('Using existing group ID:', parsed.createdGroupId);
          setCreatedGroupId(parsed.createdGroupId);
        }
        if (parsed.createdItineraryId) {
          console.log('Using existing itinerary ID:', parsed.createdItineraryId);
          setCreatedItineraryId(parsed.createdItineraryId);
        }
      } else {
        setIsNewGroup(false);
      }
    }
  }, [groupToken, travelPlannerId]);

  // Create group in database for new groups
  useEffect(() => {
    const createGroup = async () => {
      if (isNewGroup && groupData && !createdGroupId && groupToken) {
        try {
          console.log('Creating group in database:', groupData);
          const result = await insertGroup({
            variables: {
              name: groupData.groupName || 'New Group',
              token: groupToken,
            }
          });
          const newGroupId = result.data?.insert_groups?.returning?.[0]?.id;
          console.log('Group created with UUID:', newGroupId);
          setCreatedGroupId(newGroupId);

          // localStorageに保存
          const updatedGroupData = { ...groupData, createdGroupId: newGroupId };
          localStorage.setItem(`group_${groupToken}`, JSON.stringify(updatedGroupData));
          setGroupData(updatedGroupData);
        } catch (error) {
          console.error('Error creating group:', error);
          alert('グループの作成に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    };
    createGroup();
  }, [isNewGroup, groupData, createdGroupId, groupToken, insertGroup]);

  // Create itinerary in database after group is created
  useEffect(() => {
    const createItinerary = async () => {
      if (isNewGroup && groupData && createdGroupId && !createdItineraryId && groupToken) {
        try {
          console.log('Creating itinerary for group:', createdGroupId);
          const result = await insertItinerary({
            variables: {
              group_id: createdGroupId,
              title: groupData.groupName || 'New Trip',
              destination: Array.isArray(groupData.destinations) ? groupData.destinations.join(', ') : (groupData.destinations || ''),
              start_date: groupData.startDate,
              end_date: groupData.endDate,
              travel_purpose: Array.isArray(groupData.purposes) ? groupData.purposes.join(', ') : (groupData.purposes || ''),
              location_type: groupData.tripType,
              created_by: null,
            }
          });
          const newItineraryId = result.data?.insert_itineraries?.returning?.[0]?.id;
          console.log('Itinerary created with ID:', newItineraryId);
          setCreatedItineraryId(newItineraryId);

          // localStorageに保存
          const updatedGroupData = { ...groupData, createdGroupId, createdItineraryId: newItineraryId };
          localStorage.setItem(`group_${groupToken}`, JSON.stringify(updatedGroupData));
          setGroupData(updatedGroupData);
        } catch (error) {
          console.error('Error creating itinerary:', error);
          alert('旅行プランの作成に失敗しました: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    };
    createItinerary();
  }, [isNewGroup, groupData, createdGroupId, createdItineraryId, groupToken, insertItinerary]);


  if ((loading || itineraryLoading) && !isNewGroup) {
    return (
      <LoadingAirplane fullPage message="読み込み中..." />
    );
  }

  if ((error || itineraryError) && !isNewGroup) {
    console.error("GraphQL Error Details:", error || itineraryError);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
          <p>{(error || itineraryError)?.message}</p>
          <p className="mt-4">
            <Link href="/group/new" className="text-blue-600 hover:underline">
              グループ作成画面に戻る
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Handle both new groups (from localStorage) and existing groups (from GraphQL)
  let tripInfo: TripInfo;
  let startDate: Date;
  let endDate: Date;
  let termDay: number;
  let travelPlan: {
    id: number;
    destination: string;
    start_date: string;
    end_date: string;
    total_budget?: string;
  };

  if (isNewGroup && groupData) {
    // For new groups, use localStorage data
    startDate = new Date(groupData.startDate);
    endDate = new Date(groupData.endDate);
    termDay = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    tripInfo = {
      destination: groupData.destinations[0] || "目的地",
      startDate: groupData.startDate,
      endDate: groupData.endDate,
      days: termDay,
    };

    // Use the created itinerary ID or show loading state
    if (!createdItineraryId) {
      return (
        <LoadingAirplane fullPage message="旅行プランを作成中..." />
      );
    }

    travelPlan = {
      id: createdItineraryId,
      destination: tripInfo.destination,
      start_date: tripInfo.startDate,
      end_date: tripInfo.endDate,
    };
  } else {
    // For existing groups, use GraphQL data
    // travelPlannerIdがある場合は個別取得したデータを使用
    const itinerary = travelPlannerId ? itineraryData?.itineraries?.[0] : itinerariesData?.itineraries?.[0];

    if (!itinerary) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">
              旅行プランが見つかりませんでした
            </h2>
            <p className="text-gray-600 mb-4">
              指定されたトークンに対応する旅行プランは存在しません。
            </p>
            <p>
              <Link href="/group/new" className="text-blue-600 hover:underline">
                グループ作成画面に戻る
              </Link>
            </p>
          </div>
        </div>
      );
    }

    // createdGroupIdが設定されている場合、itineraryのgroup_idと一致するか検証
    if (createdGroupId && itinerary.group_id !== createdGroupId) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2 text-red-600">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600 mb-4">
              この旅行プランにアクセスする権限がありません。
            </p>
            <p>
              <Link href="/group/new" className="text-blue-600 hover:underline">
                グループ作成画面に戻る
              </Link>
            </p>
          </div>
        </div>
      );
    }

    travelPlan = itinerary;
    startDate = new Date(travelPlan.start_date);
    endDate = new Date(travelPlan.end_date);
    termDay = Math.ceil((endDate.getTime() - startDate.getTime() + 1) / 86400000);

    tripInfo = {
      destination: travelPlan.destination,
      startDate: travelPlan.start_date,
      endDate: travelPlan.end_date,
      days: termDay,
    };
  }


  // 何日目か計算
  const day = (date: string | Date) => {
    const targetDate = new Date(date);
    const start = new Date(travelPlan.start_date);
    // 1日目を1としてカウント
    const diff =
      Math.floor(
        (targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    // 範囲外の場合の調整
    if (diff < 1) return 1;
    if (diff > termDay) return termDay;
    return diff;
  };

  // 旅行日数分の空配列を用意
  const groupedActivities: DayPlan[] = Array.from({ length: tripInfo.days }, (_, i) => ({
    day: i + 1,
    activities: [],
  }));

  // Load activities from GraphQL (filtered by itinerary_id)
  const allActivities = activitiesData?.activities || [];
  const activitiesToProcess = allActivities.filter((activity: Activity) =>
    activity.itinerary_id === travelPlan.id
  );

  // 詳細シートのヘッダーイラストを先読みしておく（初回タップ時の待ちを無くす）
  preloadActivityTypeImages(activitiesToProcess, { motion: true });
  console.log("Activities to process:", activitiesToProcess.length, "Total activities:", allActivities.length, "Itinerary ID:", travelPlan.id);

  activitiesToProcess.forEach((activity: Activity) => {
    const d = day(activity.date);
    if (groupedActivities[d - 1]) {
      groupedActivities[d - 1].activities.push({
        id: activity.id,
        itinerary_id: activity.itinerary_id || travelPlan.id,
        time: activity.time,
        type: activity.type,
        name: activity.name,
        notes: activity.notes,
        date: activity.date,
        photo_url: activity.photo_url,
        location: activity.location,
        lat: activity.lat,
        lng: activity.lng,
        place_id: activity.place_id,
      });
    }
  });

  const activities: DayPlan[] = groupedActivities;

  // 現在の日のアクティビティをソート
  const sortedCurrentDayActivities = (activities.find(d => d.day === selectedDay)?.activities || [])
    .slice()
    .sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

  // アクティビティタイプに応じたアイコン取得
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "transport":
        return <Navigation className="text-blue-500" size={16} />;
      case "sightseeing":
        return <MapIcon className="text-green-500" size={16} />;
      case "restaurant":
        return <Utensils className="text-orange-500" size={16} />;
      case "hotel":
        return <Hotel className="text-purple-500" size={16} />;
      case "activity":
        return <Sunrise className="text-yellow-500" size={16} />;
      case "area":
        return <Globe className="text-indigo-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  // アクティビティタイプに応じたマーカー色を取得
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

  // 時間フォーマット関数（HH:MM:SS -> HH:MM）
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM:SS から HH:MM を取得
  };

  // 編集開始
  const startEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditModalOpen(true);
  };

  // 詳細シートからの削除
  const handleDeleteFromDetail = async (activity: Activity) => {
    if (!confirm(`「${activity.name}」を削除しますか？`)) return;
    try {
      await deleteActivity({ variables: { id: activity.id } });
      await refetchActivities();
      setSelectedActivityForDetail(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('アクティビティの削除に失敗しました');
    }
  };

  // アクティビティ削除
  const handleDeleteActivity = async (index: number) => {
    try {
      const selectedDayActivities = activities.find((day) => day.day === selectedDay)?.activities || [];
      const currentActivity = selectedDayActivities
      .sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      })[index];

      if (currentActivity?.id && confirm('このアクティビティを削除しますか？')) {
        await deleteActivity({
          variables: {
            id: currentActivity.id
          }
        });

        // データを再取得
        await refetchActivities();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('アクティビティの削除に失敗しました');
    }
  };



  // 日程変更後の処理
  const handleDatesUpdated = async (newStartDate: string, newEndDate: string) => {
    await Promise.all([refetchItinerary(), refetchActivities()]);
    const newStart = new Date(newStartDate);
    const newEnd = new Date(newEndDate);
    const newTermDay = Math.ceil((newEnd.getTime() - newStart.getTime() + 1) / 86400000);
    if (selectedDay > newTermDay) setSelectedDay(newTermDay);
    setEditDatesModalOpen(false);
  };

  // スワイプハンドラー
  const handleTouchStart = (e: React.TouchEvent, activityId: number) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
    setTouchStartTime(Date.now());
    setSwipedActivityId(activityId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === 0) return;
    setTouchCurrent(e.touches[0].clientX);
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent, activity: Activity) => {
    const diffX = Math.abs(touchStart - touchCurrent);
    const diffY = Math.abs(touchStartY - touchCurrentY);
    const elapsed = Date.now() - touchStartTime;

    // タップ判定: 移動量が小さく、短時間のタッチ
    if (diffX < 10 && diffY < 10 && elapsed < 300) {
      // 後から届く click が開いたばかりの詳細シートのバックドロップに当たり、
      // シートがすぐ閉じてしまうのを防ぐ
      e.preventDefault();
      setSelectedActivityForDetail(activity);
      setSwipedActivityId(null);
      setTouchStart(0);
      setTouchCurrent(0);
      return;
    }

    const swipeDiff = touchStart - touchCurrent;
    // 50px以上左にスワイプした場合、ボタンを表示
    if (swipeDiff > 50) {
      // ボタンを表示したまま
    } else {
      // スワイプを元に戻す
      setSwipedActivityId(null);
    }

    setTouchStart(0);
    setTouchCurrent(0);
  };

  // スワイプ量を計算
  const getSwipeOffset = (activityId: number) => {
    if (swipedActivityId === activityId && touchStart !== 0) {
      const diff = touchStart - touchCurrent;
      return Math.min(Math.max(diff, 0), 120); // 0〜120pxの範囲で制限
    }
    return swipedActivityId === activityId ? 120 : 0;
  };

  return (
    <GoogleMapsProvider>
    <div className="flex flex-col h-screen bg-gray-50">
      {/* タブナビゲーション（PC用上部タブ） */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex flex-row items-center">
          {/* ロゴ部分 */}
          <div className="flex items-center px-2 py-2 sm:px-4 sm:py-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/header_logo-removebg-preview.png"
                alt="ヘッダー画像"
                width={120}
                height={90}
                className="img-header h-7 w-auto sm:h-10"
                quality={100}
                priority
              />
            </Link>
          </div>

          {/* タブボタン部分（PC） */}
          <div className="hidden sm:flex overflow-x-auto flex-1">
            <div className="flex sm:space-x-0">
              <button
                className={`flex-shrink-0 px-4 py-3 font-bold text-base ${
                  activeTab === "plan"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("plan")}
              >
                旅行プラン
              </button>
              <button
                className={`flex-shrink-0 px-4 py-3 font-bold text-base ${
                  activeTab === "map"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("map")}
              >
                マップ
              </button>
              <button
                className={`flex-shrink-0 px-4 py-3 font-bold text-base ${
                  activeTab === "budget"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("budget")}
              >
                予算
              </button>
              <button
                className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-3 font-bold text-sm sm:text-base ${
                  activeTab === "information"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("information")}
              >
                情報
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ボトムナビゲーション（スマホ用） */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex">
          <button
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${
              activeTab === "plan" ? "text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("plan")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "plan" ? 2.5 : 1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className={`text-xs font-medium ${activeTab === "plan" ? "font-bold" : ""}`}>プラン</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${
              activeTab === "map" ? "text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("map")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "map" ? 2.5 : 1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className={`text-xs font-medium ${activeTab === "map" ? "font-bold" : ""}`}>マップ</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${
              activeTab === "budget" ? "text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("budget")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "budget" ? 2.5 : 1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-medium ${activeTab === "budget" ? "font-bold" : ""}`}>予算</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${
              activeTab === "information" ? "text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("information")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === "information" ? 2.5 : 1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-medium ${activeTab === "information" ? "font-bold" : ""}`}>情報</span>
          </button>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* モバイル用日程選択 */}
        <div className={`lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50 ${activeTab === "information" ? "hidden" : ""}`}>
          {/* モバイル用日程タブ */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
            <div className="flex overflow-x-auto scrollbar-hide flex-1">
              <div className="flex space-x-3 min-w-full">
                {Array.from({ length: tripInfo.days }, (_, i) => {
                  const dayNumber = i + 1;
                  const dayDate = new Date(startDate);
                  dayDate.setDate(dayDate.getDate() + i);
                  const formattedDate = dayDate.toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric'
                  });

                  return (
                    <button
                      key={i}
                      className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedDay === dayNumber
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedDay(dayNumber)}
                    >
                      {dayNumber}日目 {formattedDate}日
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setEditDatesModalOpen(true)}
              className="flex-none text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-gray-100"
              title="旅行期間を変更"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            </div>
          </div>

        </div>

        <div className="flex flex-1 overflow-hidden pb-16 sm:pb-0">
          {/* デスクトップ用サイドバー */}
          <div className="hidden lg:block w-48 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-700">日程</h2>
                <button
                  onClick={() => setEditDatesModalOpen(true)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-0.5 rounded"
                  title="旅行期間を変更"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                {Array.from({ length: tripInfo.days }, (_, i) => {
                  const dayNumber = i + 1;
                  const dayDate = new Date(startDate);
                  dayDate.setDate(dayDate.getDate() + i);
                  const formattedDate = dayDate.toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric'
                  });
                  
                  return (
                    <button
                      key={i}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selectedDay === dayNumber
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedDay(dayNumber)}
                    >
                      <div className="font-medium">
                        {dayNumber}日目 {formattedDate}日
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
          {activeTab === "map" ? (
            <div className="flex-1 w-full h-full">
              <MapContent
                selectedDay={selectedDay}
                groupToken={groupToken}
                isNewGroup={isNewGroup}
                groupData={groupData}
                itinerary_id={travelPlan.id}
              />
            </div>
          ) : activeTab === "budget" ? (
            <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden">
              <BudgetContent
                itinerary_id={travelPlan.id}
                itinerary={{
                  id: travelPlan.id,
                  start_date: travelPlan.start_date,
                  end_date: travelPlan.end_date,
                  destination: travelPlan.destination,
                  total_budget: travelPlan.total_budget,
                }}
                selectedDay={selectedDay}
              />
            </div>
          ) : activeTab === "information" ? (
            <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden">
              <InformationContent
                itinerary_id={travelPlan.id}
                startDate={travelPlan.start_date}
                endDate={travelPlan.end_date}
              />
            </div>
          ) : (
            <>
              {/* メインエリア：日程詳細 */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 lg:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="hidden lg:flex items-center">
                      <h2 className="text-xl font-bold text-gray-800">
                        {selectedDay}日目
                      </h2>
                      {activeTab === "map" && (
                        <span className="ml-2 text-sm text-gray-500">
                          時系列順で表示中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* タイムライン */}
                  <div className="space-y-4 lg:space-y-6">
                    {sortedCurrentDayActivities.map((activity, index) => (
                      <div key={activity.id} className="group">
                        {/* モバイル: 時間を上に表示 */}
                        <div className="lg:hidden flex items-center mb-2 px-4">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 border-[3px]"
                            style={{
                              backgroundColor: 'white',
                              borderColor: getMarkerColor(activity.type)
                            }}
                          >
                            <span
                              className="text-xs font-bold"
                              style={{ color: getMarkerColor(activity.type) }}
                            >
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 font-medium">
                            {formatTime(activity.time)}
                          </span>
                        </div>

                        {/* デスクトップ: 従来のレイアウト */}
                        <div className="flex lg:flex-row">
                          {/* 時間列（デスクトップのみ） */}
                          <div className="hidden lg:block w-20 pt-1 text-right pr-4 text-gray-500 font-medium">
                            {formatTime(activity.time)}
                          </div>

                          {/* タイムラインの縦線（デスクトップのみ） */}
                          <div className="hidden lg:flex relative flex-col items-center">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-[3px]"
                              style={{
                                backgroundColor: 'white',
                                borderColor: getMarkerColor(activity.type)
                              }}
                            >
                              <span
                                className="text-xs font-bold"
                                style={{ color: getMarkerColor(activity.type) }}
                              >
                                {index + 1}
                              </span>
                            </div>
                            {index <
                              sortedCurrentDayActivities.length - 1 && (
                              <div className="w-px bg-gray-300 h-full"></div>
                            )}
                          </div>

                          {/* モバイル用の縦線 */}
                          <div className="lg:hidden relative flex flex-col items-center mx-4">
                            {index <
                              sortedCurrentDayActivities.length - 1 && (
                              <div className="w-px bg-gray-300 h-full"></div>
                            )}
                          </div>

                          {/* 内容 */}
                          <div className="lg:ml-4 ml-3 mr-4 lg:mr-0 flex-1 relative overflow-hidden">
                            {/* アクションボタン（スワイプで表示） */}
                            <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2">
                              <button
                                onClick={() => {
                                  startEditActivity(activity);
                                  setSwipedActivityId(null);
                                }}
                                className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                                title="編集"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteActivity(index);
                                  setSwipedActivityId(null);
                                }}
                                className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                                title="削除"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            {/* スワイプ可能なコンテンツ */}
                            <div
                              className="bg-white rounded-lg border border-gray-200 shadow-sm group-hover:shadow overflow-hidden relative transition-transform duration-200 ease-out cursor-pointer"
                              style={{
                                transform: `translateX(-${getSwipeOffset(activity.id)}px)`
                              }}
                              onTouchStart={(e) => handleTouchStart(e, activity.id)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={(e) => handleTouchEnd(e, activity)}
                              onClick={() => {
                                if (swipedActivityId === activity.id) {
                                  setSwipedActivityId(null);
                                  return;
                                }
                                setSelectedActivityForDetail(activity);
                              }}
                            >
                              {/* 背景の種別イラスト（右端に敷いて左へフェード） */}
                              <ActivityCardIllustration type={activity.type} name={activity.name} />
                              <div className="relative z-10 p-4">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-start flex-1">
                                    <div className="mr-3">
                                      {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-[min(34%,180px)]">
                                      <h3 className="font-medium text-gray-800">
                                        {activity.name}
                                      </h3>
                                      <p className="text-gray-600 text-sm mt-1">
                                        {activity.notes}
                                      </p>
                                    </div>
                                  </div>
                                  {/* デスクトップ用ボタン */}
                                  <div className="hidden lg:flex space-x-1 rounded-md bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); startEditActivity(activity); }}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                      title="編集"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteActivity(index); }}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                      title="削除"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    ))}

                    {/* アクティビティ追加ボタン */}
                    <div className="flex">
                      <div className="hidden lg:block w-20"></div>
                      <div className="relative flex flex-col items-center lg:ml-0 mx-4">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      </div>
                      <button
                        className="lg:ml-4 ml-3 mr-4 lg:mr-0 border border-dashed border-gray-300 rounded-lg p-4 flex-1 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          // 現在選択されている日の実際の日付を計算
                          const selectedDate = new Date(startDate);
                          selectedDate.setDate(selectedDate.getDate() + (selectedDay - 1));
                          const formattedSelectedDate = selectedDate.toISOString().split('T')[0];
                          setSelectedDateForModal(formattedSelectedDate);
                          setAddModalOpen(true);
                        }}
                      >
                        <span className="text-blue-600">
                          + アクティビティを追加
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </div>
      <AddActivityModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        itinerary_id={travelPlan.id}
        defaultDate={selectedDateForModal || travelPlan.start_date}
        startDate={travelPlan.start_date}
        endDate={travelPlan.end_date}
        onActivityAdded={() => {
          console.log('Refetching activities...');
          refetchActivities();
        }}
      />
      <EditActivityModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingActivity(null);
          refetchActivities(); // データを再取得
        }}
        activity={editingActivity}
      />
      <ActivityDetailSheet
        activity={selectedActivityForDetail}
        isOpen={selectedActivityForDetail !== null}
        onClose={() => setSelectedActivityForDetail(null)}
        onEdit={(a) => {
          setSelectedActivityForDetail(null);
          startEditActivity(a);
        }}
        onDelete={handleDeleteFromDetail}
      />

      <EditItineraryDatesModal
        isOpen={editDatesModalOpen}
        onClose={() => setEditDatesModalOpen(false)}
        itineraryId={travelPlan.id}
        currentStartDate={travelPlan.start_date}
        currentEndDate={travelPlan.end_date}
        activities={activitiesToProcess}
        onSuccess={handleDatesUpdated}
      />
    </div>
    </GoogleMapsProvider>
  );
}
