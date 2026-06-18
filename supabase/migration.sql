-- ============================================================
--  실시간 공유 팀 관리 웹앱 - 데이터베이스 마이그레이션
-- ============================================================
--  사용법:
--   1) Supabase 대시보드 접속 → 내 프로젝트 선택
--   2) 왼쪽 메뉴에서 "SQL Editor" 클릭
--   3) "New query" 누르고, 이 파일 내용을 통째로 붙여넣기
--   4) 오른쪽 아래 "Run" (또는 Ctrl/Cmd + Enter) 클릭
--
--  이 스크립트는 "여러 번 실행해도 안전"하도록 작성했습니다.
--  (IF NOT EXISTS / DROP ... IF EXISTS 사용)
-- ============================================================


-- ── 1. 테이블 생성 ──────────────────────────────────────────

-- (1) schedules : 팀표 한 개를 나타냄. id가 곧 공유 링크의 slug.
create table if not exists public.schedules (
  id               text primary key,           -- 예: '개포도서관'
  title            text not null default '',
  night_start_date date,                        -- 야간 순환근무 시작일
  created_at       timestamptz not null default now()
);

-- (2) employees : 팀원 6명
create table if not exists public.employees (
  id          uuid primary key default gen_random_uuid(),
  schedule_id text not null references public.schedules(id) on delete cascade,
  name        text not null,
  color       text not null,                    -- 사람별 색상 (HEX)
  sort_order  int  not null default 0,          -- 0~5, 순환근무 순서
  created_at  timestamptz not null default now()
);

-- (3) entries : 일정표(탭1)의 칸 내용. 날짜 기준으로 저장. 한 칸에 여러 건 가능.
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  schedule_id text not null references public.schedules(id) on delete cascade,
  date        date,                              -- 일정표의 날짜 (예: 2026-06-01)
  employee_id uuid not null references public.employees(id) on delete cascade,
  category    text not null check (category in ('교육', '행사', '연가')),
  content     text not null default '',
  created_at  timestamptz not null default now()
);

-- 이미 entries 테이블이 있던 경우를 대비해 date 컬럼을 보강
alter table public.entries add column if not exists date date;

-- (4) night_overrides : 야간근무(탭2) 수동 교체분만 저장.
--     저장 안 된 날짜는 앱에서 규칙으로 계산해 표시.
create table if not exists public.night_overrides (
  id          uuid primary key default gen_random_uuid(),
  schedule_id text not null references public.schedules(id) on delete cascade,
  date        date not null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (schedule_id, date)                    -- 한 날짜당 한 건만
);

-- 자주 조회하는 컬럼에 인덱스
create index if not exists idx_employees_schedule on public.employees(schedule_id);
create index if not exists idx_entries_schedule   on public.entries(schedule_id);
create index if not exists idx_entries_date        on public.entries(schedule_id, date);
create index if not exists idx_overrides_schedule on public.night_overrides(schedule_id);


-- ── 2. 접근 권한 (로그인 없는 공개 앱) ─────────────────────────
--  비밀번호/로그인이 없는 앱이라, 링크를 아는 사람은 누구나
--  읽고 쓸 수 있어야 합니다. 그래서 RLS(행 수준 보안)를 켜되
--  "anon 역할에게 전부 허용"하는 정책을 답니다.
--  (민감 정보가 없는 팀 일정표 용도라 이렇게 운영합니다.)

alter table public.schedules       enable row level security;
alter table public.employees       enable row level security;
alter table public.entries         enable row level security;
alter table public.night_overrides enable row level security;

-- 기존 정책이 있으면 지우고 다시 만들기 (재실행 안전)
drop policy if exists "public_all_schedules"       on public.schedules;
drop policy if exists "public_all_employees"       on public.employees;
drop policy if exists "public_all_entries"         on public.entries;
drop policy if exists "public_all_night_overrides" on public.night_overrides;

create policy "public_all_schedules"       on public.schedules
  for all using (true) with check (true);
create policy "public_all_employees"       on public.employees
  for all using (true) with check (true);
create policy "public_all_entries"         on public.entries
  for all using (true) with check (true);
create policy "public_all_night_overrides" on public.night_overrides
  for all using (true) with check (true);


-- ── 3. Realtime (실시간 동기화) 설정 ──────────────────────────
--  Supabase의 Realtime은 'supabase_realtime' 이라는 publication을
--  구독합니다. 우리 테이블들을 거기에 등록해야 변경 알림이 옵니다.
--
--  REPLICA IDENTITY FULL : UPDATE/DELETE 시 변경 전 데이터까지
--  실시간 payload로 보내주어, 클라이언트가 더 정확히 반응합니다.

alter table public.schedules       replica identity full;
alter table public.employees       replica identity full;
alter table public.entries         replica identity full;
alter table public.night_overrides replica identity full;

-- publication에 테이블 추가 (이미 추가돼 있으면 무시)
do $$
begin
  begin
    alter publication supabase_realtime add table public.schedules;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.employees;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.entries;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.night_overrides;
  exception when duplicate_object then null;
  end;
end $$;

-- 끝! "Success. No rows returned" 이 보이면 정상입니다.
