import EntryForm from "@/components/EntryForm";
import EntryItem from "@/components/EntryItem";
import { ensureSchema, getSql, type Entry } from "@/lib/db";

// 항상 최신 목록을 보여주도록 요청마다 렌더링
export const dynamic = "force-dynamic";

const DEVELOPER_NAME = "홍길동"; // TODO: 본인 이름으로 변경
const STUDENT_ID = "202402424";

async function getEntries(): Promise<Entry[]> {
  await ensureSchema();
  const sql = getSql();
  return (await sql`
    select id, name, message, created_at, updated_at
    from guestbook_entries
    order by created_at desc, id desc
  `) as Entry[];
}

export default async function Home() {
  const entries = await getEntries();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">방명록</h1>
        <p className="text-sm text-gray-600">
          개발자: {DEVELOPER_NAME} ({STUDENT_ID})
        </p>
      </header>

      <EntryForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">전체 글 ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-gray-500">아직 작성된 글이 없습니다. 첫 글을 남겨보세요!</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <EntryItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
