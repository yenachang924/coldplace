import type {
  PlaceWithStats,
  RankingEntry,
  SubmitReportInput,
  SubmitReportResult,
  UserProfile,
} from '../../types';

export interface ColdDB {
  /** 모든 장소 + 집계(평균 별점, 제보 수, 최근 한줄평 3개, 최근 7일 제보 수) */
  listPlaces(): Promise<PlaceWithStats[]>;
  /**
   * 제보 제출. 반경 30m 내 같은 이름의 장소가 있으면 새 핀 대신 기존 핀에 별점/한줄평을 추가해요.
   */
  submitReport(input: SubmitReportInput): Promise<SubmitReportResult>;
  /** 토스 유저 키로 유저 조회, 없으면 "익명의 펭귄N" 닉네임으로 생성 */
  getOrCreateUser(tossUserKey: string): Promise<UserProfile>;
  /** 제보 수 기준 랭킹 TOP N */
  getRanking(limit: number): Promise<RankingEntry[]>;
  /** 내 순위 (제보가 없으면 null) */
  getMyRank(userId: string): Promise<RankingEntry | null>;
  /** 프로필 얼굴 이모지 변경 */
  setUserEmoji(userId: string, emoji: string): Promise<void>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinLastWeek(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() <= WEEK_MS;
}

/** 이번 주 핫한 시원곳 TOP 3: 최근 7일 제보 수 기준 */
export function hotPlaces(places: PlaceWithStats[], count = 3): PlaceWithStats[] {
  return [...places]
    .filter((p) => p.weeklyCount > 0)
    .sort((a, b) => b.weeklyCount - a.weeklyCount || b.reportCount - a.reportCount)
    .slice(0, count);
}
