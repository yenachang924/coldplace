import { COLORS } from './theme';

export interface LatLng {
  lat: number;
  lng: number;
}

export const CATEGORIES = ['카페', '건물·실내', '그늘·야외', '물가', '기타'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface CommentItem {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PlaceWithStats {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  avgRating: number;
  reportCount: number;
  weeklyCount: number;
  recentComments: CommentItem[];
}

export interface UserProfile {
  id: string;
  nickname: string;
  reportCount: number;
  emoji?: string;
}

export interface RankingEntry {
  userId: string;
  nickname: string;
  reportCount: number;
  rank: number;
  emoji?: string;
}

/** 프로필로 고를 수 있는 얼굴 이모지 */
export const FACE_EMOJIS = ['🐧', '🥶', '😎', '😊', '🤗', '😇', '🤖', '👻', '🐻‍❄️', '😺', '🦊', '☃️'] as const;

export const DEFAULT_EMOJI = '🐧';

export interface SubmitReportInput {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  rating: number;
  comment?: string;
}

export interface SubmitReportResult {
  placeId: string;
  mergedIntoExisting: boolean;
}

/** 위치 권한 거부 시 기본 중심: 인하대 */
export const DEFAULT_CENTER: LatLng = { lat: 37.4501, lng: 126.6535 };

/** 같은 장소로 간주하는 반경 (m) */
export const SAME_PLACE_RADIUS_M = 30;

export function pinColor(avgRating: number): string {
  if (avgRating >= 4.0) return COLORS.primaryDark;
  if (avgRating >= 3.0) return COLORS.primary;
  return COLORS.primaryWeak;
}
