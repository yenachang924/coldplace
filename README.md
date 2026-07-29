# coldplace ❄️

"지금 제일 시원한 곳"을 제보하고 발견하는 위치 기반 UGC 앱인토스 미니앱 (v1, 검증용 MVP).

## 구현 전 필수 확인 결과 (docs-search)

> 프록시 정책으로 개발자센터 문서 페이지 직접 접근이 막혀 있어, SDK 패키지 타입 정의(`@apps-in-toss/web-framework` 2.10.8),
> 공식 예제 저장소([toss/apps-in-toss-examples](https://github.com/toss/apps-in-toss-examples)), 개발자 커뮤니티 검색 결과로 확인했어요.

### 1. 앱인토스 웹뷰에서 카카오맵 JS SDK — 사용 가능 (조건부)

- 앱인토스 WebView SDK는 일반 웹앱(Vite 등)을 react-native-webview로 감싸는 구조라 카카오맵 JS SDK 로드 자체는 가능해요.
- 단, [커뮤니티 사례](https://techchat-apps-in-toss.toss.im/t/js-sdk-webview/3859)처럼 토스 앱 웹뷰에서 `window.kakao.maps`가
  로드되지 않는 문제가 보고돼 있어요. 원인은 대부분 **카카오 개발자 콘솔의 Web 플랫폼 도메인 미등록**
  (배포 도메인 `*.apps.tossmini.com`, `*.private-apps.tossmini.com` 등록 필요)과 스크립트 로드 타이밍이에요.
- 대응: `autoload=false` + `kakao.maps.load()` 콜백으로 로드하고, **10초 내 로드 실패 시 내장 간이 지도로 자동 폴백**하도록
  구현해서 중단 없이 검증 가능해요 (`src/lib/kakao.ts`, `src/components/MapView.tsx`).

### 2. 위치 권한

- `granite.config.ts`의 `permissions`에 `{ name: 'geolocation', access: 'access' }` 선언 (공식 예제 `device-apis`와 동일).
- 위치 조회는 `getCurrentLocation({ accuracy: Accuracy.Balanced })`, 권한 상태 확인/재요청은
  `getCurrentLocation.getPermission()` / `getCurrentLocation.openPermissionDialog()`.
- 권한 거부 시 인하대(37.4501, 126.6535) 기본 중심으로 동작해요.

### 3. 토스 로그인 유저 고유 ID

- `appLogin()`은 `{ authorizationCode, referrer }`를 반환해요. `authorizationCode`는 **서버에서 토스 OAuth API로 교환**해야
  유저 정보를 얻는 일회용 코드라, 백엔드 없는 v1에서는 유저 식별에 쓸 수 없어요.
- 대신 `getAnonymousKey()`가 반환하는 안정적인 유저 고유 해시(`{ type: 'HASH', hash }`)를 유저 ID로 매핑했어요
  (문서상 "사용자를 식별하고 데이터를 관리"하는 용도).
- 플로우: 제보/랭킹 진입 시 `appLogin()` → `getAnonymousKey()` → Supabase `users.toss_user_key`에 매핑.
  토스 앱 밖(로컬 브라우저)에서는 localStorage 로컬 키로 대체돼요.

## 실행

```bash
npm install
npm run dev    # granite dev — 앱인토스 샌드박스 연결 + vite dev 서버 (localhost:5173)
npm run build  # ait build — vite build 후 coldplace.ait 아티팩트 생성
```

### 환경 변수 (.env)

`.env.example`을 복사해서 `.env`를 만들어요. **둘 다 비워도 동작해요** — 지도는 내장 간이 지도,
데이터는 localStorage 목 DB(시드 포함)로 폴백해서 3화면 플로우를 그대로 검증할 수 있어요.

| 변수 | 설명 |
| --- | --- |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript 키. 콘솔에 `localhost:5173` + 배포 도메인 등록 필요 |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase 프로젝트. `supabase/schema.sql`을 SQL Editor에서 실행 후 사용 |

## UX/UI 커스터마이징 (테마)

색은 전부 `src/theme.ts` 한 파일의 토큰으로 모여 있어요. `COLORS.primary`(군청) 등 값만 바꾸면
탭·버튼·핀·배지·배경이 한 번에 바뀌어요. `npm run dev` 상태에서 저장하면 HMR로 즉시 반영돼요.
폰트는 `index.html`에서 토스 공식 CDN(Toss Product Sans + Toss Face 이모지)을 로드해요.

## 무더위쉼터 데이터 교체

지도에 기본으로 깔리는 ⛱️ 공공 쉼터 핀은 `src/data/shelters.json`에서 읽어요 (현재는 예시 발췌
25곳, 좌표 근사값). 전국 데이터로 바꾸려면:

1. [공공데이터포털](https://www.data.go.kr)에서 행정안전부 "무더위쉼터" CSV 다운로드
2. `node scripts/shelters-from-csv.mjs 무더위쉼터.csv` 실행 → `src/data/shelters.json` 교체
3. `npm run build`

## 챌린지 제출 (.ait)

1. [앱인토스 콘솔](https://developers.apps-in-toss.im)에서 미니앱 등록 — `granite.config.ts`의
   `appName: "coldplace"`, 한글 이름 "콜드플레이스"와 동일하게
2. `npm run build` → 프로젝트 루트에 `coldplace.ait` 생성 (실제 구동 파일)
3. 콘솔에 `.ait` 업로드 후 샌드박스 테스트 → 출품 폼에는 콘솔에 등록한 appName 그대로 기입

### 챌린지 폼 작성 내용

**앱 설명 (≤20자)**
```
지금 제일 시원한 곳 지도
```

**챌린지 주제 연결**
폭염이라는 사회 문제를 **기술과 커뮤니티**로 해결하는 위치 기반 UGC 솔루션이에요.
사용자들이 실시간으로 제일 시원한 곳을 발견하고 제보하면, 별점과 한줄평으로 검증하며 이웃과 나눠요.
공공 쉼터는 회색으로 기본 표시하고, 시민 제보는 별점에 따라 3색 핀(⭐⭐⭐⭐⭐ / ⭐⭐⭐ / ⭐)으로 구분해요.
토스 앱 내 미니앱으로 설치 없이 즉시 사용 가능합니다.

## 구조

```
granite.config.ts        앱인토스 설정 (appName, brand, geolocation 권한)
src/
  App.tsx                화면 전환 (지도/제보/랭킹) + 하단 탭
  screens/MapScreen      지도 + 핀(별점 구간별 3색) + 바텀시트 + TOP3 칩 + 제보 FAB
  screens/ReportScreen   현재 위치 미세조정 + 장소명/별점/카테고리/한줄평 + 30m 중복 병합
  screens/RankingScreen  제보 수 TOP 20 + 내 순위 고정 + 배지(얼음왕 👑 / 개척자)
  components/MapView     카카오맵 ↔ 내장 간이 지도 자동 폴백
  lib/appBridge.ts       getCurrentLocation / appLogin / getAnonymousKey 래퍼 (브라우저 폴백 포함)
  lib/db/                ColdDB 인터페이스 + Supabase 구현 + localStorage 목 구현
supabase/schema.sql      users / places / reports + report_count 트리거 + place_stats 뷰
```

## 정책 (스펙 반영)

- 위치 권한 거부 → 인하대 중심, 안내 배너 표시
- 비로그인 → 지도 조회 가능, 제보 제출/내 순위는 로그인 유도
- 같은 이름 + 반경 30m 재제보 → 새 핀 대신 기존 핀에 별점/한줄평 추가
- 욕설 필터·신고·오프라인·푸시는 v1 스코프 아웃
