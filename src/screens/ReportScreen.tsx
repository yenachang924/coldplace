import { useState } from 'react';
import { CATEGORIES, type Category, type LatLng } from '../types';
import { getDB } from '../lib/db';
import { ensureLogin } from '../lib/session';
import { MapView } from '../components/MapView';
import { StarInput } from '../components/Stars';

interface ReportScreenProps {
  initialCenter: LatLng;
  onDone: (message: string) => void;
  onBack: () => void;
}

const MAX_COMMENT = 50;

export function ReportScreen({ initialCenter, onDone, onBack }: ReportScreenProps) {
  const [position, setPosition] = useState<LatLng>(initialCenter);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<Category>('카페');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length > 0 && rating >= 1;

  async function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await ensureLogin();
      if (!user) {
        setError('제보하려면 토스 로그인이 필요해요.');
        return;
      }
      const result = await getDB().submitReport({
        userId: user.id,
        name: name.trim(),
        lat: position.lat,
        lng: position.lng,
        category,
        rating,
        comment: comment.trim() || undefined,
      });
      onDone(
        result.mergedIntoExisting
          ? '기존 장소에 제보를 추가했어요! ❄️'
          : '새로운 시원곳을 제보했어요! ❄️',
      );
    } catch (e) {
      console.error(e);
      setError('제보에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#4E5968',
    marginBottom: 6,
    display: 'block',
  } as const;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 8px',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          aria-label="뒤로"
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 8 }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#191F28', margin: 0 }}>시원곳 제보</h1>
      </header>

      <div style={{ padding: '0 20px 40px' }}>
        <label style={labelStyle}>위치 (지도를 움직여 미세조정)</label>
        <MapView
          center={initialCenter}
          onCenterChanged={setPosition}
          showCenterMarker
          style={{ width: '100%', height: 180, borderRadius: 12 }}
        />
        <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 4 }}>
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>장소명 (필수)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: OO카페 2층 창가"
            maxLength={40}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 15,
              border: '1px solid #E5E8EB',
              borderRadius: 10,
              outline: 'none',
              background: '#F9FAFB',
            }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>시원함 별점 (필수)</label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>카테고리</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                style={{
                  border: category === c ? '1.5px solid #3182F6' : '1px solid #E5E8EB',
                  background: category === c ? '#E8F3FF' : '#fff',
                  color: category === c ? '#3182F6' : '#4E5968',
                  fontWeight: category === c ? 700 : 400,
                  borderRadius: 18,
                  padding: '8px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>
            한줄평 (선택, {comment.length}/{MAX_COMMENT})
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
            placeholder="예: 에어컨 바로 아래 자리가 명당"
            rows={2}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 15,
              border: '1px solid #E5E8EB',
              borderRadius: 10,
              outline: 'none',
              resize: 'none',
              background: '#F9FAFB',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#F04452' }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '16px 0',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            background: valid && !submitting ? '#3182F6' : '#B0B8C1',
            cursor: valid && !submitting ? 'pointer' : 'default',
          }}
        >
          {submitting ? '제보 중...' : '제보하기'}
        </button>
      </div>
    </div>
  );
}
