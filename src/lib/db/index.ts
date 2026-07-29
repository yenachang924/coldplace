import { MockDB } from './mock';
import { SupabaseDB } from './supabaseDb';
import type { ColdDB } from './types';

export { hotPlaces } from './types';
export type { ColdDB } from './types';

let instance: ColdDB | null = null;

/**
 * Supabase 환경 변수가 있으면 실 DB, 없으면 localStorage 목 DB.
 * 목 DB는 샌드박스에서 제보 → 지도 → 랭킹 플로우를 끊김 없이 검증하기 위한 용도예요.
 */
export function getDB(): ColdDB {
  if (!instance) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    instance = url && key ? new SupabaseDB(url, key) : new MockDB();
  }
  return instance;
}

export function usingMockDB(): boolean {
  return !(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
