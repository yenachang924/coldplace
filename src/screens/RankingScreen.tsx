import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_EMOJI, FACE_EMOJIS, type RankingEntry, type UserProfile } from '../types';
import { getDB } from '../lib/db';
import { ensureLogin, getCachedUser, updateCachedEmoji } from '../lib/session';

const RANKING_LIMIT = 20;

function badges(entry: RankingEntry): string[] {
  const result: string[] = [];
  if (entry.rank === 1) result.push('얼음왕 👑');
  if (entry.reportCount >= 10) result.push('개척자');
  return result;
}

interface RankingScreenProps {
  refreshKey: number;
}

export function RankingScreen({ refreshKey }: RankingScreenProps) {
  const [user, setUser] = useState<UserProfile | null>(() => getCachedUser());
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [myRank, setMyRank] = useState<RankingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadData = useCallback(async (me: UserProfile | null) => {
    setLoading(true);
    try {
      const db = getDB();
      const top = await db.getRanking(RANKING_LIMIT);
      setRanking(top);
      if (me) setMyRank(await db.getMyRank(me.id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(user);
  }, [user, refreshKey, loadData]);

  async function handleLogin() {
    setLoggingIn(true);
    try {
      const profile = await ensureLogin();
      if (profile) setUser(profile);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handlePickEmoji(emoji: string) {
    if (!user) return;
    setPickerOpen(false);
    setUser({ ...user, emoji });
    updateCachedEmoji(emoji);
    await getDB().setUserEmoji(user.id, emoji);
    setRanking((prev) => prev.map((e) => (e.userId === user.id ? { ...e, emoji } : e)));
  }

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
  } as const;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      <header style={{ padding: '20px 20px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191F28', margin: 0 }}>
          제보 랭킹 TOP {RANKING_LIMIT}
        </h1>
        <p style={{ fontSize: 13, color: '#8B95A1', margin: '4px 0 0' }}>
          시원곳을 많이 제보한 순서예요.
        </p>
      </header>

      {/* 내 순위 상단 고정 */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#E9EDF8',
          margin: '12px 16px',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {user ? (
          <div style={rowStyle}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#26428B', width: 36 }}>
              {myRank ? `${myRank.rank}위` : '-'}
            </span>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              aria-label="얼굴 이모지 바꾸기"
              style={{
                border: '1.5px dashed #26428B',
                borderRadius: '50%',
                width: 40,
                height: 40,
                fontSize: 20,
                background: '#fff',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {user.emoji ?? DEFAULT_EMOJI}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#191F28' }}>
                {user.nickname} (나)
                {myRank &&
                  badges(myRank).map((b) => (
                    <span
                      key={b}
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#26428B',
                        background: '#fff',
                        borderRadius: 6,
                        padding: '2px 6px',
                      }}
                    >
                      {b}
                    </span>
                  ))}
              </div>
              <div style={{ fontSize: 12, color: '#6B7684' }}>
                {myRank ? `제보 ${myRank.reportCount}건` : '아직 제보가 없어요'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...rowStyle, justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#333D4B' }}>
              로그인하면 내 순위를 볼 수 있어요
            </span>
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              style={{
                border: 'none',
                borderRadius: 10,
                background: '#26428B',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              {loggingIn ? '로그인 중...' : '토스 로그인'}
            </button>
          </div>
        )}
        {user && pickerOpen && (
          <div style={{ padding: '0 20px 14px' }}>
            <div style={{ fontSize: 12, color: '#6B7684', marginBottom: 8 }}>
              내 얼굴 이모지를 골라보세요
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FACE_EMOJIS.map((emoji) => {
                const selected = (user.emoji ?? DEFAULT_EMOJI) === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => handlePickEmoji(emoji)}
                    style={{
                      width: 40,
                      height: 40,
                      fontSize: 20,
                      borderRadius: '50%',
                      border: selected ? '2px solid #26428B' : '1px solid #E5E8EB',
                      background: selected ? '#fff' : '#FAFBFC',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8B95A1' }}>불러오는 중...</div>
      ) : ranking.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8B95A1' }}>
          아직 제보한 사람이 없어요. 첫 번째 제보자가 되어보세요!
        </div>
      ) : (
        ranking.map((entry) => {
          const isMe = user?.id === entry.userId;
          return (
            <div
              key={entry.userId}
              style={{
                ...rowStyle,
                background: isMe ? '#F4F6FB' : 'transparent',
                borderBottom: '1px solid #F2F4F6',
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  width: 36,
                  color: entry.rank <= 3 ? '#26428B' : '#8B95A1',
                }}
              >
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `${entry.rank}위`}
              </span>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                {entry.emoji ?? DEFAULT_EMOJI}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, color: '#191F28', fontWeight: isMe ? 700 : 400 }}>
                  {entry.nickname}
                  {isMe && ' (나)'}
                </span>
                {badges(entry).map((b) => (
                  <span
                    key={b}
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#26428B',
                      background: '#E9EDF8',
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}
                  >
                    {b}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#6B7684' }}>{entry.reportCount}건</span>
            </div>
          );
        })
      )}
    </div>
  );
}
