create table public.leaderboard (
    id           bigint generated always as identity primary key,
    name         text          not null,
    image_name   text          not null,
    prompt       text          not null,
    created_at   timestamptz   not null default now(),
    prompt_score numeric(5, 2) not null default 0,
    image_score  numeric(5, 2) not null default 0
);

-- RLS 활성화
alter table public.leaderboard enable row level security;

-- 읽기 공개 허용 (리더보드 특성상 누구나 조회 가능)
create policy "Anyone can read leaderboard"
    on public.leaderboard
    for select
    using (true);