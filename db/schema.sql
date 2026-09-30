-- Neon SQL Editor 에서 직접 실행해도 되고, 앱이 첫 요청 시 자동 생성하기도 함
create table if not exists guestbook_entries (
  id serial primary key,
  name varchar(50) not null,
  message text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- TICKET 04: 좋아요
alter table guestbook_entries add column if not exists likes integer not null default 0;

-- TICKET 05: 비밀번호 연속 실패 잠금
alter table guestbook_entries add column if not exists failed_attempts integer not null default 0;
alter table guestbook_entries add column if not exists locked_until timestamptz;
