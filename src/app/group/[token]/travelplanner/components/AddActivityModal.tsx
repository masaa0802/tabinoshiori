import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { INSERT_ACTIVITIES } from "@/graphql/mutates";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary_id: number;
  defaultDate?: string;
  onActivityAdded?: () => void;
  startDate?: string;
  endDate?: string;
}

const typeOptions = [
  { label: "交通", value: "transport" },
  { label: "観光スポット", value: "sightseeing" },
  { label: "飲食店", value: "restaurant" },
  { label: "ホテル", value: "hotel" },
  { label: "アクティビティ", value: "activity" },
  { label: "エリア", value: "area" },
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({ isOpen, onClose, itinerary_id, defaultDate, onActivityAdded, startDate, endDate }) => {
  const [date, setDate] = useState(defaultDate || "");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState(typeOptions[0].value);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState("");

  const [insertActivity] = useMutation(INSERT_ACTIVITIES);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    // Google Maps APIが利用可能になったら初期化
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  // defaultDateが変更されたら日付を更新
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    }
  }, [defaultDate]);

  // 旅行期間の日付リストを生成
  const generateDateOptions = () => {
    if (!startDate || !endDate) return [];

    const dates: { value: string; label: string; dayNumber: number }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const currentDate = new Date(start);
    let dayNumber = 1;

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = new Intl.DateTimeFormat('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }).format(currentDate);

      dates.push({
        value: dateStr,
        label: `${dayNumber}日目 - ${formattedDate}`,
        dayNumber: dayNumber
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    return dates;
  };

  const dateOptions = generateDateOptions();

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowSuggestions(true);

    // Google Maps APIがロードされていない場合は初期化を試行
    if (!autocompleteService.current && isLoaded && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }

    if (value.length > 2 && autocompleteService.current) {
      // 複数のタイプで検索して結果をマージ
      const searchPromises = [
        // 駅・交通機関
        new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          autocompleteService.current!.getPlacePredictions(
            {
              input: value,
              types: ['transit_station'],
              language: 'ja',
              region: 'jp'
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions);
              } else {
                resolve([]);
              }
            }
          );
        }),
        // 一般的な施設
        new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          autocompleteService.current!.getPlacePredictions(
            {
              input: value,
              types: ['establishment'],
              language: 'ja',
              region: 'jp'
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions);
              } else {
                resolve([]);
              }
            }
          );
        }),
        // 地名・住所
        new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          autocompleteService.current!.getPlacePredictions(
            {
              input: value,
              types: ['geocode'],
              language: 'ja',
              region: 'jp'
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                resolve(predictions);
              } else {
                resolve([]);
              }
            }
          );
        })
      ];

      Promise.all(searchPromises).then((results) => {
        const [transitStations, establishments, geocodes] = results;
        // 駅を優先して表示し、重複を除去
        const allSuggestions = [...transitStations, ...establishments, ...geocodes];
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
          index === self.findIndex(s => s.place_id === suggestion.place_id)
        );
        setSuggestions(uniqueSuggestions.slice(0, 10)); // 最大10件
      });
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setLocation(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setPlaceId(suggestion.place_id);

    // 場所の詳細情報と写真を取得
    if (placesService.current && suggestion.place_id) {
      placesService.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['photos', 'name', 'formatted_address', 'geometry'],
          language: 'ja'
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // 場所の名前を保存（住所を除く）
            if (place.name) {
              setPlaceName(place.name);
            }

            // 緯度・経度を取得
            if (place.geometry && place.geometry.location) {
              setLat(place.geometry.location.lat());
              setLng(place.geometry.location.lng());
            }

            if (place.photos && place.photos.length > 0) {
              // 最初の写真のURLを取得（幅400pxで）
              const photoUrl = place.photos[0].getUrl({ maxWidth: 400 });
              console.log('Photo URL obtained:', photoUrl);
              setPhotoUrl(photoUrl);
            }
          }
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // placeNameがあれば使用、なければlocationを使用
      const activityName = placeName || location;

      console.log('Submitting activity with data:', {
        itinerary_id,
        date,
        time,
        location,
        name: activityName,
        notes,
        type,
        photo_url: photoUrl,
        lat,
        lng,
        place_id: placeId,
      });

      const result = await insertActivity({
        variables: {
          itinerary_id,
          date,
          time,
          location,
          name: activityName,
          notes,
          type,
          photo_url: photoUrl,
          lat,
          lng,
          place_id: placeId,
        },
      });

      console.log('Activity insertion result:', result);

      // フォームをリセット
      setTime("");
      setLocation("");
      setPlaceName("");
      setNotes("");
      setType(typeOptions[0].value);
      setSuggestions([]);
      setShowSuggestions(false);
      setPhotoUrl("");
      setLat(null);
      setLng(null);
      setPlaceId("");
      // アクティビティが追加されたことを親コンポーネントに通知
      if (onActivityAdded) {
        onActivityAdded();
      }
      onClose();
    } catch (e) {
      console.error('Error inserting activity:', e);
      alert('アクティビティの追加に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  if (!isOpen) return null;

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0000004d' }}>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <div className="text-center">Google Maps APIを読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0000004d' }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">アクティビティを追加</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">日付</label>
            {dateOptions.length > 0 ? (
              <select
                className="w-full border rounded px-3 py-2"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              >
                <option value="">日付を選択してください</option>
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">時間</label>
            <input
              type="time"
              className="w-full border rounded px-3 py-2"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-1">場所</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={location}
              onChange={e => handleLocationChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="場所を入力してください"
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => {
                  // 場所の種類を判定してアイコンを決定
                  const getPlaceIcon = (types: string[]) => {
                    if (types.includes('transit_station')) return '🚉';
                    if (types.includes('airport')) return '✈️';
                    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
                    if (types.includes('lodging')) return '🏨';
                    if (types.includes('tourist_attraction')) return '🎯';
                    if (types.includes('shopping_mall') || types.includes('store')) return '🛍️';
                    if (types.includes('hospital')) return '🏥';
                    if (types.includes('school') || types.includes('university')) return '🏫';
                    return '📍';
                  };

                  return (
                    <div
                      key={suggestion.place_id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">
                          {getPlaceIcon(suggestion.types)}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-gray-600">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">タイプ</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={type}
              onChange={e => setType(e.target.value)}
              required
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-2 px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white font-bold"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddActivityModal; 