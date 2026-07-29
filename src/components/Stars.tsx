import { COLORS } from '../theme';

interface StarsProps {
  value: number;
  size?: number;
}

/** 읽기 전용 별점 표시 */
export function Stars({ value, size = 14 }: StarsProps) {
  const full = Math.round(value);
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }} aria-label={`별점 ${value}점`}>
      <span style={{ color: COLORS.star }}>{'★'.repeat(full)}</span>
      <span style={{ color: COLORS.starOff }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
}

/** 별점 입력 (1~5) */
export function StarInput({ value, onChange }: StarInputProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            fontSize: 32,
            lineHeight: 1,
            cursor: 'pointer',
            color: n <= value ? COLORS.star : COLORS.starOff,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
