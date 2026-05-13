create table public.leaderboard (
    id           bigint generated always as identity primary key,
    name         text          not null,
    image_name   text          not null,
    prompt       text          not null,
    created_at   timestamptz   not null default now(),
    prompt_score numeric(5, 2) not null default 0,
    ip           text          not null
);

-- RLS 활성화
alter table public.leaderboard enable row level security;

-- 읽기 공개 허용 (리더보드 특성상 누구나 조회 가능)
create policy "Anyone can read leaderboard"
    on public.leaderboard
    for select
    using (true);

-- 챌린지 관리 테이블 생성
create table public.challenge (
    id           bigint generated always as identity primary key,
    prompt       text          not null,                    -- 정답 프롬프트
    result_image text          not null,                    -- 정답 이미지 파일명
    start_date   date          not null,                    -- 노출 시작일
    end_date     date          not null,                    -- 노출 종료일
    show_yn      char(1)       not null default 'Y',        -- 노출 여부 (Y/N)
    created_at   timestamptz   not null default now()
);

-- RLS 활성화
alter table public.challenge enable row level security;

-- 읽기 공개 허용 (show_yn이 'Y'인 것만)
create policy "Anyone can read challenge"
    on public.challenge
    for select
    using (show_yn = 'Y');

-- 인덱스 추가 (날짜 기반 조회 성능 최적화)
create index idx_challenge_dates on public.challenge (start_date, end_date);