# 앱인토스 챌린지 제출 가이드

## 1. 앱 정보

| 항목 | 값 |
| --- | --- |
| **앱 이름 (appName)** | coldplace |
| **한글 이름** | 콜드플레이스 |

## 2. 챌린지 제출 폼 작성

### 앱 설명 (≤20자)

```
지금 제일 시원한 곳 지도
```

**선택 사항** (더 짧은 버전들):
- `시원한 곳 지도` (10자)
- `폭염 대피 위치 공유` (10자)
- `제일 시원한 곳 찾기` (10자)

### 챌린지 주제 연결 문구

**제목: 폭염 시대 이웃과 함께하는 시원한 공간 지도**

본 앱 "콜드플레이스"는 사용자들이 실시간으로 제일 시원한 곳을 발견하고 제보하는 **위치 기반 UGC(User-Generated Content)** 미니앱입니다.

- **폭염 피해 감소**: 공공 쉼터(무더위쉼터)와 시민이 공유하는 카페, 도서관 등을 한눈에 확인
- **커뮤니티 기반 해결책**: 제보·별점·한줄평으로 실제 시원한 곳을 검증하고 공유
- **토스 기술 활용**: 위치 권한(Geolocation), 로그인(appLogin), 익명 사용자 식별(getAnonymousKey)로 신뢰성 있는 UGC 플랫폼 구현
- **설치 불필요**: 토스 앱 내 미니앱으로 즉시 사용 가능

폭염이라는 사회 문제를 **기술과 커뮤니티**로 해결하는 솔루션입니다.

---

## 3. 빌드 및 제출 절차

### Step 1: 앱인토스 콘솔 등록
1. [앱인토스 개발자 콘솔](https://developers.apps-in-toss.im) 접속
2. 새 미니앱 등록:
   - **appName**: `coldplace`
   - **앱 이름 (한글)**: `콜드플레이스`
   - **설명**: 위의 "앱 설명" 텍스트 복사

### Step 2: 로컬 빌드
```bash
npm install
npm run build
```
→ 프로젝트 루트에 `coldplace.ait` 생성

### Step 3: 콘솔에 업로드 및 테스트
1. 콘솔에서 `.ait` 파일 업로드
2. 샌드박스(토스 개발 앱)에서 테스트
3. 지도 조회, 제보, 랭킹 3화면 흐름 검증

### Step 4: 챌린지 제출 폼 작성
- **앱 이름**: `coldplace` (콘솔에 등록한 appName 그대로)
- **앱 설명**: "지금 제일 시원한 곳 지도" (≤20자)
- **챌린지 주제 연결**: 위의 "챌린지 주제 연결 문구" 텍스트 복사
- **기타 필드**: 요청하는 정보 입력

---

## 4. 환경 설정 (선택)

실제 배포 전에 다음을 설정하면 실제 데이터로 테스트 가능:

### Kakao Map (지도 표시)
```bash
# .env 파일
VITE_KAKAO_MAP_KEY=your_kakao_api_key
```
- [카카오 개발자 콘솔](https://developers.kakao.com)에서 JavaScript 키 발급
- 등록 도메인: `localhost:5173`, `*.apps.tossmini.com`, `*.private-apps.tossmini.com`

### Supabase (실제 데이터 저장)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
- [Supabase](https://supabase.com)에서 프로젝트 생성
- `supabase/schema.sql` 실행 (SQL Editor)
- `.env`에 URL과 Anon Key 입력

**환경 변수가 없어도 동작**: 내장 간이 지도 + localStorage 목 DB로 샌드박스 테스트 가능

---

## 5. 체크리스트

- [ ] `appName: "coldplace"` 확인 (granite.config.ts)
- [ ] `npm run build` 성공 → `coldplace.ait` 생성
- [ ] 앱인토스 콘솔에 미니앱 등록
- [ ] `.ait` 업로드 및 샌드박스 테스트 완료
- [ ] 지도/제보/랭킹 3화면 동작 확인
- [ ] 챌린지 제출 폼 작성 및 제출

---

## 6. 추가 리소스

- **공식 예제**: https://github.com/toss/apps-in-toss-examples
- **@apps-in-toss/web-framework**: v2.10.8
- **Toss TDS Mobile**: v2.5.0
- **README.md**: 테마 커스터마이징, 무더위쉼터 데이터 교체, 로컬 개발 가이드
