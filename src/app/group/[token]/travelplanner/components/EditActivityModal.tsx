import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { useJsApiLoader } from "@react-google-maps/api";
import { UPDATE_ACTIVITY } from "@/graphql/mutates";
import LoadingAirplane from "@/components/LoadingAirplane";

const LIBRARIES: ("places")[] = ["places"];

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
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
  } | null;
}

const typeOptions = [
  { label: "交通", value: "transport" },
  { label: "観光スポット", value: "sightseeing" },
  { label: "飲食店", value: "restaurant" },
  { label: "ホテル", value: "hotel" },
  { label: "アクティビティ", value: "activity" },
  { label: "エリア", value: "area" },
];

// Google Places のタイプをアプリのアクティビティタイプに変換
function inferActivityType(placeTypes: string[]): string | null {
  if (placeTypes.some(t => ["transit_station", "subway_station", "train_station", "bus_station", "airport", "ferry_terminal", "light_rail_station"].includes(t))) return "transport";
  if (placeTypes.some(t => ["lodging", "hotel"].includes(t))) return "hotel";
  if (placeTypes.some(t => ["restaurant", "food", "cafe", "bakery", "bar", "meal_takeaway", "meal_delivery"].includes(t))) return "restaurant";
  if (placeTypes.some(t => ["tourist_attraction", "museum", "park", "amusement_park", "art_gallery", "zoo", "aquarium", "stadium", "natural_feature", "place_of_worship"].includes(t))) return "sightseeing";
  if (placeTypes.some(t => ["shopping_mall", "store", "clothing_store", "convenience_store", "department_store", "supermarket"].includes(t))) return "activity";
  return null;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({ isOpen, onClose, activity }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("sightseeing");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState("");

  const [updateActivity, { loading: isSubmitting }] = useMutation(UPDATE_ACTIVITY);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  // ① SessionToken: 入力開始〜候補選択までを1セッションとして課金をまとめる
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  // ② デバウンス用タイマー
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
    language: 'ja',
    region: 'JP',
  });

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (activity) {
      const activityDate = new Date(activity.date);
      setDate(activityDate.toISOString().split('T')[0]);
      setTime(activity.time.substring(0, 5));
      setLocation(activity.location);
      setPlaceName(activity.name);
      setNotes(activity.notes || "");
      setType(activity.type);
      setLat(activity.lat || null);
      setLng(activity.lng || null);
      setPlaceId(activity.place_id || "");
    }
  }, [activity]);

  // ③ 実際の検索処理（1リクエストに統合）
  const fetchSuggestions = useCallback((value: string) => {
    if (!autocompleteService.current || value.length <= 2) {
      setSuggestions([]);
      return;
    }

    // SessionTokenがなければ新規作成（入力開始時）
    if (!sessionToken.current) {
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        sessionToken: sessionToken.current,
        language: 'ja',
        region: 'jp',
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 8));
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setShowSuggestions(true);

    if (!autocompleteService.current && isLoaded && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }

    // ④ デバウンス: 300ms待ってから検索（タイピング中のリクエストを抑制）
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    setLocation(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setPlaceId(suggestion.place_id);

    const inferred = inferActivityType(suggestion.types ?? []);
    if (inferred) setType(inferred);

    // ⑤ getDetails: photosを除外してBasicフィールドのみ取得（コスト削減）
    //    SessionTokenを渡すことでAutocomplete+DetailsをセットでSession課金にまとめる
    if (placesService.current && suggestion.place_id && sessionToken.current) {
      placesService.current.getDetails(
        {
          placeId: suggestion.place_id,
          fields: ['name', 'formatted_address', 'geometry', 'types'],
          sessionToken: sessionToken.current,
          language: 'ja',
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            if (place.name) setPlaceName(place.name);
            if (place.types) {
              const detailed = inferActivityType(place.types);
              if (detailed) setType(detailed);
            }
            if (place.geometry?.location) {
              setLat(place.geometry.location.lat());
              setLng(place.geometry.location.lng());
            }
          }
          // ⑥ getDetails完了でセッション終了 → 次の検索用に新しいTokenを発行
          sessionToken.current = null;
        }
      );
    } else {
      sessionToken.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    try {
      const activityName = placeName || location;
      await updateActivity({
        variables: {
          id: activity.id,
          name: activityName,
          location,
          notes,
          type,
          date,
          time: time + ':00',
          photo_url: activity.photo_url ?? null,
          lat,
          lng,
          place_id: placeId,
        },
      });
      onClose();
    } catch (e) {
      console.error(e);
      alert('アクティビティの更新に失敗しました');
    }
  };

  if (!isOpen || !activity) return null;

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0000004d' }}>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <div className="flex flex-col items-center">
            <div className="mb-2"><LoadingAirplane /></div>
            <p className="text-gray-600">Google Maps APIを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0000004d' }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-4 text-gray-400 hover:text-gray-600" onClick={onClose}>×</button>
        <h2 className="text-lg font-bold mb-4">アクティビティを編集</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">日付</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={date || ""} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">時間</label>
            <input type="time" className="w-full border rounded px-3 py-2" value={time || ""} onChange={e => setTime(e.target.value)} required />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium mb-1">場所</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={location || ""}
              onChange={e => handleLocationChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="場所を入力してください"
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => {
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
                        <span className="mr-2 text-lg">{getPlaceIcon(suggestion.types)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-sm text-gray-600">{suggestion.structured_formatting.secondary_text}</div>
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
            <textarea className="w-full border rounded px-3 py-2" value={notes || ""} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">タイプ</label>
            <select className="w-full border rounded px-3 py-2" value={type || typeOptions[0].value} onChange={e => setType(e.target.value)} required>
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button type="button" className="mr-2 px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={isSubmitting}>キャンセル</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-bold disabled:opacity-50 min-w-[64px]" disabled={isSubmitting}>
              {isSubmitting ? <LoadingAirplane /> : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivityModal;
