import { neon } from "@neondatabase/serverless";

export type Entry = {
  id: number;
  name: string;
  message: string;
  created_at: string;
  updated_at: string | null;
};

let schemaReady: Promise<unknown> | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  return neon(url);
}

// 첫 요청 시 테이블이 없으면 생성 (db/schema.sql 과 동일)
export function ensureSchema() {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      create table if not exists guestbook_entries (
        id serial primary key,
        name varchar(50) not null,
        message text not null,
        password_hash text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz
      )
    `.catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}
