import type { UserProfile } from '../types';
import { loginAndGetUserKey } from './appBridge';
import { getDB } from './db';

const PROFILE_STORAGE = 'coldplace.profile.v1';

export function getCachedUser(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_STORAGE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function cacheUser(profile: UserProfile): void {
  localStorage.setItem(PROFILE_STORAGE, JSON.stringify(profile));
}

/** 캐시된 프로필의 얼굴 이모지를 갱신해요. */
export function updateCachedEmoji(emoji: string): void {
  const cached = getCachedUser();
  if (cached) cacheUser({ ...cached, emoji });
}

/**
 * 로그인 보장. 이미 로그인돼 있으면 캐시된 프로필을,
 * 아니면 토스 로그인 → 유저 조회/생성 후 프로필을 반환해요.
 * 사용자가 로그인을 거부하면 null.
 */
export async function ensureLogin(): Promise<UserProfile | null> {
  const cached = getCachedUser();
  if (cached) return cached;

  const key = await loginAndGetUserKey();
  if (!key) return null;

  const profile = await getDB().getOrCreateUser(key);
  cacheUser(profile);
  return profile;
}
