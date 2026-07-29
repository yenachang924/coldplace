import {
  Accuracy,
  appLogin,
  getAnonymousKey,
  getCurrentLocation,
} from '@apps-in-toss/web-framework';
import { DEFAULT_CENTER, type LatLng } from '../types';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

/** 토스 앱 웹뷰 안에서 실행 중인지 (네이티브 브릿지 존재 여부) */
export function isInTossWebView(): boolean {
  return typeof (window as { ReactNativeWebView?: unknown }).ReactNativeWebView !== 'undefined';
}

/**
 * 현재 위치를 가져와요.
 * 1) 앱인토스 브릿지 getCurrentLocation (granite.config.ts의 geolocation 권한 필요)
 * 2) 브라우저 navigator.geolocation (샌드박스 밖 개발용)
 * 3) 실패/거부 시 인하대 기본 좌표
 */
export async function getMyLocation(): Promise<{ position: LatLng; granted: boolean }> {
  if (isInTossWebView()) {
    try {
      const res = await withTimeout(getCurrentLocation({ accuracy: Accuracy.Balanced }), 8000);
      return { position: { lat: res.coords.latitude, lng: res.coords.longitude }, granted: true };
    } catch {
      // 권한 거부 또는 브릿지 오류 → 기본 좌표
      return { position: DEFAULT_CENTER, granted: false };
    }
  }

  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }),
      );
      return {
        position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        granted: true,
      };
    } catch {
      return { position: DEFAULT_CENTER, granted: false };
    }
  }

  return { position: DEFAULT_CENTER, granted: false };
}

const LOCAL_KEY_STORAGE = 'coldplace.localUserKey';

/**
 * 로그인하고 유저 고유 키를 얻어요.
 * - 토스 앱 안: appLogin()으로 토스 로그인 → getAnonymousKey()로 안정적인 유저 고유 해시를 얻어요.
 *   (appLogin의 authorizationCode는 서버 교환용이라 v1 클라이언트에서는 식별에 getAnonymousKey를 사용해요)
 * - 토스 앱 밖(로컬 브라우저 개발): localStorage에 로컬 키를 만들어 재사용해요.
 * 실패하면 null을 반환해요 (로그인 거부 등).
 */
export async function loginAndGetUserKey(): Promise<string | null> {
  if (isInTossWebView()) {
    try {
      await withTimeout(appLogin(), 30000);
      const keyResult = await withTimeout(getAnonymousKey(), 8000);
      if (keyResult && keyResult !== 'ERROR' && keyResult.type === 'HASH') {
        return `toss:${keyResult.hash}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  let key = localStorage.getItem(LOCAL_KEY_STORAGE);
  if (!key) {
    key = `local:${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_KEY_STORAGE, key);
  }
  return key;
}
