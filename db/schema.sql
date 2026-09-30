-- Neon SQL Editor 에서 직접 실행해도 되고, 앱이 첫 요청 시 자동 생성하기도 함
create table if not exists guestbook_entries (
  id serial primary key,
  name varchar(50) not null,
  message text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
