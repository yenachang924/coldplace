/**
 * coldplace 테마 토큰 — UX/UI를 손볼 때 이 파일만 수정하면 앱 전체에 반영돼요.
 * 색 이름은 TDS(토스 디자인 시스템) 그레이 스케일 관례를 따랐어요.
 */
export const COLORS = {
  /** 브랜드 기본색 (군청) — 탭, 버튼, 배지, 보통 핀 */
  primary: '#26428B',
  /** 평균 별점 4.0 이상 핀 (더 진한 군청) */
  primaryDark: '#16295E',
  /** 평균 별점 3.0 미만 핀 (연한 군청) */
  primaryWeak: '#8FA3D9',
  /** 브랜드 연한 배경 — 내 순위 카드, 선택된 카테고리 */
  primaryBg: '#E9EDF8',
  /** 브랜드 아주 연한 배경 — 랭킹 내 행 강조 */
  primaryBgFaint: '#F4F6FB',
  /** 공공 무더위쉼터 핀 (중립 회색) */
  shelter: '#9AA5B1',

  /** 별점 */
  star: '#FFB331',
  starOff: '#D1D6DB',

  /** 비활성 버튼 */
  disabled: '#B0B8C1',
  /** 오류 텍스트 */
  danger: '#F04452',
} as const;
