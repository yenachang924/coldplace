let loadPromise: Promise<typeof kakao.maps | null> | null = null;

export function hasKakaoKey(): boolean {
  return Boolean(import.meta.env.VITE_KAKAO_MAP_KEY);
}

/**
 * 카카오맵 JS SDK를 동적으로 로드해요.
 * - 앱인토스 웹뷰에서 script 로드가 지연될 수 있어서 autoload=false + kakao.maps.load 콜백을 사용해요.
 * - 키가 없거나 10초 안에 로드에 실패하면 null을 반환하고, 호출부는 내장 지도로 폴백해요.
 */
export function loadKakaoMaps(): Promise<typeof kakao.maps | null> {
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!key) {
    loadPromise = Promise.resolve(null);
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 10000);
    const done = (maps: typeof kakao.maps | null) => {
      clearTimeout(timeout);
      resolve(maps);
    };

    if (window.kakao?.maps) {
      done(window.kakao.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        done(null);
        return;
      }
      window.kakao.maps.load(() => done(window.kakao ? window.kakao.maps : null));
    };
    script.onerror = () => done(null);
    document.head.appendChild(script);
  });

  return loadPromise;
}
