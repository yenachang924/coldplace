import { useState } from 'react';
import { TDSMobileProvider, useToast } from '@toss/tds-mobile';
import { DEFAULT_CENTER, type LatLng } from './types';
import { MapScreen } from './screens/MapScreen';
import { ReportScreen } from './screens/ReportScreen';
import { RankingScreen } from './screens/RankingScreen';

type Screen = 'map' | 'report' | 'ranking';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('map');
  const [reportCenter, setReportCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [refreshKey, setRefreshKey] = useState(0);
  const { openToast } = useToast();

  const tabStyle = (active: boolean) =>
    ({
      flex: 1,
      border: 'none',
      background: 'none',
      padding: '10px 0 14px',
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      color: active ? '#3182F6' : '#8B95A1',
      cursor: 'pointer',
    }) as const;

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily:
          "'Toss Product Sans', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {screen === 'map' && (
          <MapScreen
            refreshKey={refreshKey}
            onReport={(center) => {
              setReportCenter(center);
              setScreen('report');
            }}
          />
        )}
        {screen === 'report' && (
          <ReportScreen
            initialCenter={reportCenter}
            onBack={() => setScreen('map')}
            onDone={(message) => {
              setRefreshKey((k) => k + 1);
              setScreen('map');
              openToast(message);
            }}
          />
        )}
        {screen === 'ranking' && <RankingScreen refreshKey={refreshKey} />}
      </main>

      {screen !== 'report' && (
        <nav
          style={{
            display: 'flex',
            borderTop: '1px solid #F2F4F6',
            background: '#fff',
            flexShrink: 0,
          }}
        >
          <button style={tabStyle(screen === 'map')} onClick={() => setScreen('map')}>
            🗺️
            <br />
            지도
          </button>
          <button style={tabStyle(screen === 'ranking')} onClick={() => setScreen('ranking')}>
            🏆
            <br />
            랭킹
          </button>
        </nav>
      )}
    </div>
  );
}

export function App() {
  const ua = navigator.userAgent;
  return (
    <TDSMobileProvider
      userAgent={{
        fontA11y: undefined,
        fontScale: undefined,
        isAndroid: /android/i.test(ua),
        isIOS: /iphone|ipad|ipod/i.test(ua),
      }}
    >
      <AppContent />
    </TDSMobileProvider>
  );
}
