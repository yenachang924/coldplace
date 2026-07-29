import {
  DEFAULT_CENTER,
  DEFAULT_EMOJI,
  SAME_PLACE_RADIUS_M,
  type Category,
  type PlaceWithStats,
  type RankingEntry,
  type SubmitReportInput,
  type SubmitReportResult,
  type UserProfile,
} from '../../types';
import { distanceMeters, normalizePlaceName } from '../geo';
import { isWithinLastWeek, type ColdDB } from './types';

interface MockPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  createdBy: string;
  createdAt: string;
}

interface MockReport {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface MockUser {
  id: string;
  tossUserKey: string;
  nickname: string;
  emoji?: string;
}

interface MockData {
  places: MockPlace[];
  reports: MockReport[];
  users: MockUser[];
}

const STORAGE_KEY = 'coldplace.mockdb.v1';

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** 샌드박스 검증용 시드: 인하대 주변 데모 데이터 */
function seed(): MockData {
  const { lat, lng } = DEFAULT_CENTER;
  const users: MockUser[] = [
    { id: 'seed-u1', tossUserKey: 'seed:1', nickname: '익명의 펭귄1', emoji: '🥶' },
    { id: 'seed-u2', tossUserKey: 'seed:2', nickname: '익명의 펭귄2', emoji: '😎' },
    { id: 'seed-u3', tossUserKey: 'seed:3', nickname: '익명의 펭귄3', emoji: '☃️' },
  ];
  const places: MockPlace[] = [
    { id: 'seed-p1', name: '인하대 정석학술정보관 로비', lat: lat + 0.0012, lng: lng + 0.0008, category: '건물·실내', createdBy: 'seed-u1', createdAt: daysAgo(6) },
    { id: 'seed-p2', name: '카페 얼음곳간', lat: lat - 0.0009, lng: lng + 0.0021, category: '카페', createdBy: 'seed-u2', createdAt: daysAgo(5) },
    { id: 'seed-p3', name: '용현공원 그늘막', lat: lat + 0.0022, lng: lng - 0.0015, category: '그늘·야외', createdBy: 'seed-u3', createdAt: daysAgo(4) },
    { id: 'seed-p4', name: '인하대 후문 분수터', lat: lat - 0.002, lng: lng - 0.001, category: '물가', createdBy: 'seed-u1', createdAt: daysAgo(3) },
  ];
  const reports: MockReport[] = [
    { id: 'seed-r1', placeId: 'seed-p1', userId: 'seed-u1', rating: 5, comment: '에어컨 풀가동, 자리도 많아요', createdAt: daysAgo(6) },
    { id: 'seed-r2', placeId: 'seed-p1', userId: 'seed-u2', rating: 4, comment: '조용하고 시원함', createdAt: daysAgo(2) },
    { id: 'seed-r3', placeId: 'seed-p1', userId: 'seed-u3', rating: 5, comment: null, createdAt: daysAgo(1) },
    { id: 'seed-r4', placeId: 'seed-p2', userId: 'seed-u2', rating: 4, comment: '아이스 아메리카노가 진리', createdAt: daysAgo(5) },
    { id: 'seed-r5', placeId: 'seed-p2', userId: 'seed-u1', rating: 3, comment: '사람이 좀 많아요', createdAt: daysAgo(1) },
    { id: 'seed-r6', placeId: 'seed-p3', userId: 'seed-u3', rating: 3, comment: '바람 불면 살만해요', createdAt: daysAgo(4) },
    { id: 'seed-r7', placeId: 'seed-p4', userId: 'seed-u1', rating: 2, comment: '물은 있는데 그늘이 없음', createdAt: daysAgo(3) },
  ];
  return { places, reports, users };
}

function load(): MockData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as MockData;
    } catch {
      // 손상된 데이터는 새로 시드
    }
  }
  const data = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function save(data: MockData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function toStats(data: MockData, place: MockPlace): PlaceWithStats {
  const reports = data.reports
    .filter((r) => r.placeId === place.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const avg = reports.length
    ? reports.reduce((sum, r) => sum + r.rating, 0) / reports.length
    : 0;
  return {
    id: place.id,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    avgRating: Math.round(avg * 10) / 10,
    reportCount: reports.length,
    weeklyCount: reports.filter((r) => isWithinLastWeek(r.createdAt)).length,
    recentComments: reports
      .filter((r) => r.comment)
      .slice(0, 3)
      .map((r) => ({ rating: r.rating, comment: r.comment as string, createdAt: r.createdAt })),
  };
}

function reportCountOf(data: MockData, userId: string): number {
  return data.reports.filter((r) => r.userId === userId).length;
}

function rankingOf(data: MockData): RankingEntry[] {
  return data.users
    .map((u) => ({
      userId: u.id,
      nickname: u.nickname,
      emoji: u.emoji ?? DEFAULT_EMOJI,
      reportCount: reportCountOf(data, u.id),
    }))
    .filter((e) => e.reportCount > 0)
    .sort((a, b) => b.reportCount - a.reportCount)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/** Supabase 환경 변수가 없을 때 사용하는 localStorage 기반 목 DB (샌드박스 검증용) */
export class MockDB implements ColdDB {
  async listPlaces(): Promise<PlaceWithStats[]> {
    const data = load();
    return data.places.map((p) => toStats(data, p));
  }

  async submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
    const data = load();
    const existing = data.places.find(
      (p) =>
        normalizePlaceName(p.name) === normalizePlaceName(input.name) &&
        distanceMeters(p, input) <= SAME_PLACE_RADIUS_M,
    );

    let placeId: string;
    if (existing) {
      placeId = existing.id;
    } else {
      placeId = crypto.randomUUID();
      data.places.push({
        id: placeId,
        name: input.name.trim(),
        lat: input.lat,
        lng: input.lng,
        category: input.category,
        createdBy: input.userId,
        createdAt: new Date().toISOString(),
      });
    }

    data.reports.push({
      id: crypto.randomUUID(),
      placeId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
      createdAt: new Date().toISOString(),
    });

    save(data);
    return { placeId, mergedIntoExisting: Boolean(existing) };
  }

  async getOrCreateUser(tossUserKey: string): Promise<UserProfile> {
    const data = load();
    let user = data.users.find((u) => u.tossUserKey === tossUserKey);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        tossUserKey,
        nickname: `익명의 펭귄${data.users.length + 1}`,
        emoji: DEFAULT_EMOJI,
      };
      data.users.push(user);
      save(data);
    }
    return {
      id: user.id,
      nickname: user.nickname,
      emoji: user.emoji ?? DEFAULT_EMOJI,
      reportCount: reportCountOf(data, user.id),
    };
  }

  async setUserEmoji(userId: string, emoji: string): Promise<void> {
    const data = load();
    const user = data.users.find((u) => u.id === userId);
    if (user) {
      user.emoji = emoji;
      save(data);
    }
  }

  async getRanking(limit: number): Promise<RankingEntry[]> {
    return rankingOf(load()).slice(0, limit);
  }

  async getMyRank(userId: string): Promise<RankingEntry | null> {
    return rankingOf(load()).find((e) => e.userId === userId) ?? null;
  }
}
