import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { LatLng } from '../types';
import { loadKakaoMaps } from '../lib/kakao';

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
}

interface MapViewProps {
  center: LatLng;
  pins?: MapPin[];
  onPinTap?: (id: string) => void;
  /** 지도 드래그가 끝났을 때 새 중심 좌표 (제보 위치 미세조정용) */
  onCenterChanged?: (center: LatLng) => void;
  /** 값이 바뀌면 해당 좌표로 이동 (TOP3 칩 탭 등) */
  focus?: LatLng | null;
  /** 제보 화면용 중앙 고정 십자 마커 */
  showCenterMarker?: boolean;
  style?: CSSProperties;
}

/**
 * 지도 컴포넌트.
 * - VITE_KAKAO_MAP_KEY가 있으면 카카오맵 JS SDK를 사용해요.
 * - 키가 없거나 로드에 실패하면(웹뷰 도메인 미등록 등) 내장 간이 지도로 폴백해서
 *   샌드박스에서도 전체 플로우를 검증할 수 있어요.
 */
export function MapView(props: MapViewProps) {
  const [mode, setMode] = useState<'loading' | 'kakao' | 'fallback'>('loading');

  useEffect(() => {
    let alive = true;
    loadKakaoMaps().then((maps) => {
      if (alive) setMode(maps ? 'kakao' : 'fallback');
    });
    return () => {
      alive = false;
    };
  }, []);

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: '#E9EDF8',
    ...props.style,
  };

  return (
    <div style={wrapperStyle}>
      {mode === 'kakao' && <KakaoMap {...props} />}
      {mode === 'fallback' && <FallbackMap {...props} />}
      {props.showCenterMarker && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -100%)',
            fontSize: 28,
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          📍
        </div>
      )}
      {mode === 'fallback' && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            zIndex: 20,
            fontSize: 11,
            color: '#4E5968',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 8,
            padding: '4px 8px',
            pointerEvents: 'none',
          }}
        >
          간이 지도 모드 (카카오맵 키 미설정)
        </div>
      )}
    </div>
  );
}

function KakaoMap({ center, pins = [], onPinTap, onCenterChanged, focus }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const onCenterChangedRef = useRef(onCenterChanged);
  const onPinTapRef = useRef(onPinTap);
  onCenterChangedRef.current = onCenterChanged;
  onPinTapRef.current = onPinTap;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const maps = window.kakao?.maps;
    if (!maps) return;

    const map = new maps.Map(containerRef.current, {
      center: new maps.LatLng(center.lat, center.lng),
      level: 4,
    });
    mapRef.current = map;

    maps.event.addListener(map, 'dragend', () => {
      const c = map.getCenter();
      onCenterChangedRef.current?.({ lat: c.getLat(), lng: c.getLng() });
    });
    // eslint 없이도 의도를 명확히: 최초 1회만 생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const maps = window.kakao?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = pins.map((pin) => {
      const el = document.createElement('div');
      el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';
      el.innerHTML =
        `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
        `background:${pin.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>` +
        `<div style="margin-top:2px;font-size:10px;color:#333d4b;background:rgba(255,255,255,0.9);` +
        `border-radius:4px;padding:0 4px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${pin.label}</div>`;
      el.addEventListener('click', () => onPinTapRef.current?.(pin.id));
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(pin.lat, pin.lng),
        content: el,
        yAnchor: 1,
        clickable: true,
      });
      overlay.setMap(map);
      return overlay;
    });
  }, [pins]);

  useEffect(() => {
    const maps = window.kakao?.maps;
    if (!maps || !mapRef.current || !focus) return;
    mapRef.current.panTo(new maps.LatLng(focus.lat, focus.lng));
  }, [focus]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

/** 내장 간이 지도: 드래그로 이동, 등장방형 근사 투영으로 핀 배치 */
function FallbackMap({ center, pins = [], onPinTap, onCenterChanged, focus }: MapViewProps) {
  const [viewCenter, setViewCenter] = useState<LatLng>(center);
  const dragRef = useRef<{ startX: number; startY: number; startCenter: LatLng } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const METERS_PER_PX = 1.2;

  useEffect(() => {
    if (focus) setViewCenter(focus);
  }, [focus]);

  function project(p: { lat: number; lng: number }): { x: number; y: number } {
    const mPerDegLat = 110574;
    const mPerDegLng = 111320 * Math.cos((viewCenter.lat * Math.PI) / 180);
    return {
      x: ((p.lng - viewCenter.lng) * mPerDegLng) / METERS_PER_PX,
      y: (-(p.lat - viewCenter.lat) * mPerDegLat) / METERS_PER_PX,
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, startCenter: viewCenter };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const mPerDegLat = 110574;
    const mPerDegLng = 111320 * Math.cos((drag.startCenter.lat * Math.PI) / 180);
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setViewCenter({
      lat: drag.startCenter.lat + (dy * METERS_PER_PX) / mPerDegLat,
      lng: drag.startCenter.lng - (dx * METERS_PER_PX) / mPerDegLng,
    });
  }

  function handlePointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    onCenterChanged?.(viewCenter);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        touchAction: 'none',
        cursor: 'grab',
        backgroundImage:
          'linear-gradient(rgba(49,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(49,130,246,0.08) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      {pins.map((pin) => {
        const { x, y } = project(pin);
        return (
          <button
            key={pin.id}
            onClick={() => onPinTap?.(pin.id)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -100%)',
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                background: pin.color,
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
            <span
              style={{
                marginTop: 2,
                fontSize: 10,
                color: '#333D4B',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 4,
                padding: '0 4px',
                maxWidth: 96,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {pin.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
