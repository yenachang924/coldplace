import type { LatLng } from '../types';

/** 두 좌표 사이 거리 (m), haversine */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 장소명 비교용 정규화: 공백 제거 + 소문자 */
export function normalizePlaceName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}
