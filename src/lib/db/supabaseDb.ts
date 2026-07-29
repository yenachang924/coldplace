import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
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

interface PlaceRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  reports: { rating: number; comment: string | null; created_at: string }[];
}

interface UserRow {
  id: string;
  nickname: string;
  report_count: number;
}

/** supabase/schema.sql 스키마를 사용하는 실 구현 */
export class SupabaseDB implements ColdDB {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async listPlaces(): Promise<PlaceWithStats[]> {
    const { data, error } = await this.client
      .from('places')
      .select('id, name, lat, lng, category, reports(rating, comment, created_at)');
    if (error) throw error;

    return (data as PlaceRow[]).map((p) => {
      const reports = [...p.reports].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const avg = reports.length
        ? reports.reduce((sum, r) => sum + r.rating, 0) / reports.length
        : 0;
      return {
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        avgRating: Math.round(avg * 10) / 10,
        reportCount: reports.length,
        weeklyCount: reports.filter((r) => isWithinLastWeek(r.created_at)).length,
        recentComments: reports
          .filter((r) => r.comment)
          .slice(0, 3)
          .map((r) => ({
            rating: r.rating,
            comment: r.comment as string,
            createdAt: r.created_at,
          })),
      };
    });
  }

  async submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
    // 같은 이름 후보를 가져와 30m 반경은 클라이언트에서 판정 (v1 규모에서 충분)
    const { data: candidates, error: findError } = await this.client
      .from('places')
      .select('id, name, lat, lng');
    if (findError) throw findError;

    const existing = (candidates ?? []).find(
      (p) =>
        normalizePlaceName(p.name) === normalizePlaceName(input.name) &&
        distanceMeters({ lat: p.lat, lng: p.lng }, input) <= SAME_PLACE_RADIUS_M,
    );

    let placeId: string;
    if (existing) {
      placeId = existing.id;
    } else {
      const { data: created, error: insertError } = await this.client
        .from('places')
        .insert({
          name: input.name.trim(),
          lat: input.lat,
          lng: input.lng,
          category: input.category,
          created_by: input.userId,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      placeId = created.id;
    }

    // users.report_count는 DB 트리거(bump_report_count)가 갱신해요.
    const { error: reportError } = await this.client.from('reports').insert({
      place_id: placeId,
      user_id: input.userId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    });
    if (reportError) throw reportError;

    return { placeId, mergedIntoExisting: Boolean(existing) };
  }

  async getOrCreateUser(tossUserKey: string): Promise<UserProfile> {
    const { data: found, error: findError } = await this.client
      .from('users')
      .select('id, nickname, report_count')
      .eq('toss_user_key', tossUserKey)
      .maybeSingle();
    if (findError) throw findError;
    if (found) {
      const row = found as UserRow;
      return { id: row.id, nickname: row.nickname, reportCount: row.report_count };
    }

    const { count } = await this.client
      .from('users')
      .select('id', { count: 'exact', head: true });
    const nickname = `익명의 펭귄${(count ?? 0) + 1}`;

    const { data: created, error: insertError } = await this.client
      .from('users')
      .insert({ toss_user_key: tossUserKey, nickname })
      .select('id, nickname, report_count')
      .single();
    if (insertError) throw insertError;
    const row = created as UserRow;
    return { id: row.id, nickname: row.nickname, reportCount: row.report_count };
  }

  async getRanking(limit: number): Promise<RankingEntry[]> {
    const { data, error } = await this.client
      .from('users')
      .select('id, nickname, report_count')
      .gt('report_count', 0)
      .order('report_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as UserRow[]).map((u, i) => ({
      userId: u.id,
      nickname: u.nickname,
      reportCount: u.report_count,
      rank: i + 1,
    }));
  }

  async getMyRank(userId: string): Promise<RankingEntry | null> {
    const { data: me, error } = await this.client
      .from('users')
      .select('id, nickname, report_count')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!me || (me as UserRow).report_count === 0) return null;
    const row = me as UserRow;

    const { count } = await this.client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('report_count', row.report_count);

    return {
      userId: row.id,
      nickname: row.nickname,
      reportCount: row.report_count,
      rank: (count ?? 0) + 1,
    };
  }
}
