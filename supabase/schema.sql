-- coldplace v1 스키마 (Supabase SQL Editor에서 실행)

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  -- 토스 로그인 고유 ID 매핑 (getAnonymousKey 해시, 'toss:...' / 로컬 개발 'local:...')
  toss_user_key text not null unique,
  nickname text not null,
  emoji text not null default '🐧',
  report_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 기존 테이블에 emoji 컬럼이 없으면 추가 (재실행 안전)
alter table users add column if not exists emoji text not null default '🐧';

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  category text not null,
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places (id) on delete cascade,
  user_id uuid not null references users (id),
  rating int not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 50),
  created_at timestamptz not null default now()
);

create index if not exists reports_place_id_idx on reports (place_id);
create index if not exists reports_user_id_idx on reports (user_id);
create index if not exists users_report_count_idx on users (report_count desc);

-- users.report_count 자동 갱신 트리거
create or replace function bump_report_count() returns trigger as $$
begin
  update users set report_count = report_count + 1 where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists reports_bump_count on reports;
create trigger reports_bump_count
  after insert on reports
  for each row execute function bump_report_count();

-- 집계 뷰: 장소별 평균 별점 / 제보 수 / 최근 7일 제보 수 (v1은 캐싱 없이 뷰로 처리)
create or replace view place_stats as
select
  p.id,
  p.name,
  p.lat,
  p.lng,
  p.category,
  coalesce(round(avg(r.rating)::numeric, 1), 0) as avg_rating,
  count(r.id) as report_count,
  count(r.id) filter (where r.created_at > now() - interval '7 days') as weekly_count
from places p
left join reports r on r.place_id = p.id
group by p.id;

-- v1: anon 키로 읽고 쓰므로 RLS는 전체 허용으로 열어둬요.
-- (욕설 필터/신고와 함께 v2에서 강화 예정)
alter table users enable row level security;
alter table places enable row level security;
alter table reports enable row level security;

create policy users_all on users for all using (true) with check (true);
create policy places_all on places for all using (true) with check (true);
create policy reports_all on reports for all using (true) with check (true);
