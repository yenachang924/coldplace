import { useEffect, useMemo, useState } from 'react';
import type { LatLng, PlaceWithStats } from '../types';
import { pinColor } from '../types';
import { COLORS } from '../theme';
import { getDB, hotPlaces } from '../lib/db';
import { getMyLocation } from '../lib/appBridge';
import { MapView, type MapPin } from '../components/MapView';
import { Stars } from '../components/Stars';
import sheltersData from '../data/shelters.json';

interface Shelter {
  name: string;
  lat: number;
  lng: number;
}

const SHELTERS: Shelter[] = sheltersData.shelters;
const SHELTER_PREFIX = 'shelter:';

interface MapScreenProps {
  onReport: (center: LatLng) => void;
  /** 제보 완료 등으로 갱신이 필요할 때 증가하는 카운터 */
  refreshKey: number;
}

export function MapScreen({ onReport, refreshKey }: MapScreenProps) {
  const [center, setCenter] = useState<LatLng | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [places, setPlaces] = useState<PlaceWithStats[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [showShelters, setShowShelters] = useState(true);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  useEffect(() => {
    getMyLocation().then(({ position, granted }) => {
      setCenter(position);
      setMapCenter(position);
      setLocationDenied(!granted);
    });
  }, []);

  useEffect(() => {
    getDB().listPlaces().then(setPlaces);
  }, [refreshKey]);

  const pins: MapPin[] = useMemo(() => {
    const placePins = places.map((p) => ({
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      color: pinColor(p.avgRating),
      label: p.name,
    }));
    if (!showShelters) return placePins;
    // 공공 무더위쉼터는 회색 보조 핀으로 먼저 깔아서, 유저 제보 핀이 위에 오도록 해요.
    const shelterPins = SHELTERS.map((s, i) => ({
      id: `${SHELTER_PREFIX}${i}`,
      lat: s.lat,
      lng: s.lng,
      color: COLORS.shelter,
      label: s.name,
    }));
    return [...shelterPins, ...placePins];
  }, [places, showShelters]);

  const hot = useMemo(() => hotPlaces(places), [places]);
  const selected = places.find((p) => p.id === selectedId) ?? null;

  if (!center) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <span style={{ color: '#6B7684' }}>위치 확인 중...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <MapView
        center={center}
        pins={pins}
        focus={focus}
        onPinTap={(id) => {
          if (id.startsWith(SHELTER_PREFIX)) {
            setSelectedShelter(SHELTERS[Number(id.slice(SHELTER_PREFIX.length))] ?? null);
            setSelectedId(null);
          } else {
            setSelectedId(id);
            setSelectedShelter(null);
          }
        }}
        onCenterChanged={setMapCenter}
        style={{ width: '100%', height: '100%' }}
      />

      {/* 이번 주 핫한 시원곳 TOP 3 */}
      {hot.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            right: 0,
            zIndex: 40,
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '0 12px',
          }}
        >
          {hot.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setFocus({ lat: p.lat, lng: p.lng });
                setSelectedId(p.id);
              }}
              style={{
                flexShrink: 0,
                border: 'none',
                borderRadius: 20,
                padding: '8px 14px',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                fontSize: 13,
                fontWeight: 600,
                color: '#333D4B',
                cursor: 'pointer',
              }}
            >
              🔥{i + 1}위 {p.name} · 주간 {p.weeklyCount}건
            </button>
          ))}
        </div>
      )}

      {locationDenied && (
        <div
          style={{
            position: 'absolute',
            top: hot.length > 0 ? 56 : 12,
            left: 12,
            right: 12,
            zIndex: 40,
            background: 'rgba(51,61,75,0.9)',
            color: '#fff',
            fontSize: 12,
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          위치 권한이 없어 인하대 중심으로 표시하고 있어요.
        </div>
      )}

      {/* 무더위쉼터 레이어 토글 */}
      <button
        onClick={() => {
          setShowShelters((v) => !v);
          setSelectedShelter(null);
        }}
        style={{
          position: 'absolute',
          left: 16,
          bottom: 24,
          zIndex: 50,
          border: 'none',
          borderRadius: 20,
          padding: '10px 14px',
          background: showShelters ? COLORS.primary : '#fff',
          color: showShelters ? '#fff' : '#4E5968',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
        }}
      >
        ⛱️ 공공 쉼터 {SHELTERS.length}
      </button>

      {/* 제보 플로팅 버튼 */}
      <button
        onClick={() => onReport(mapCenter ?? center)}
        style={{
          position: 'absolute',
          right: 16,
          bottom: selected ? 300 : selectedShelter ? 180 : 24,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: COLORS.primary,
          color: '#fff',
          fontSize: 26,
          boxShadow: '0 4px 12px rgba(38,66,139,0.4)',
          cursor: 'pointer',
        }}
        aria-label="제보하기"
      >
        ＋
      </button>

      {/* 무더위쉼터 바텀시트 */}
      {selectedShelter && (
        <>
          <div
            onClick={() => setSelectedShelter(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 60 }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 70,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              padding: '20px 20px 28px',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>
              {selectedShelter.name}
            </div>
            <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>
              행정안전부 지정 무더위쉼터
            </div>
            <div style={{ fontSize: 14, color: '#333D4B', marginTop: 12 }}>
              누구나 무료로 이용할 수 있는 공공 냉방 쉼터예요. 다녀오셨다면 ＋버튼으로 시원함
              별점을 남겨 이웃에게 알려주세요!
            </div>
          </div>
        </>
      )}

      {/* 핀 상세 바텀시트 */}
      {selected && (
        <>
          <div
            onClick={() => setSelectedId(null)}
            style={{ position: 'absolute', inset: 0, zIndex: 60 }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 70,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
              padding: '20px 20px 28px',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#191F28' }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 12, color: '#8B95A1', marginTop: 2 }}>
                  {selected.category} · 제보 {selected.reportCount}건
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Stars value={selected.avgRating} size={16} />
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>
                  {selected.avgRating.toFixed(1)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {selected.recentComments.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8B95A1' }}>아직 한줄평이 없어요.</div>
              ) : (
                selected.recentComments.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 0',
                      borderBottom: i < selected.recentComments.length - 1 ? '1px solid #F2F4F6' : 'none',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Stars value={c.rating} size={11} />
                    <span style={{ fontSize: 14, color: '#333D4B' }}>{c.comment}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
