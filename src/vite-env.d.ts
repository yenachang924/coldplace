/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace kakao.maps {
  function load(callback: () => void): void;
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }
  class Map {
    constructor(container: HTMLElement, options: { center: LatLng; level: number });
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    relayout(): void;
  }
  class CustomOverlay {
    constructor(options: {
      position: LatLng;
      content: HTMLElement | string;
      yAnchor?: number;
      zIndex?: number;
      clickable?: boolean;
    });
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
  }
  namespace event {
    function addListener(target: unknown, type: string, handler: () => void): void;
    function removeListener(target: unknown, type: string, handler: () => void): void;
  }
}

interface Window {
  kakao?: { maps: typeof kakao.maps };
}
