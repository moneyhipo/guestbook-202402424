import Link from "next/link";
import EntryForm from "@/components/EntryForm";
import EntryItem from "@/components/EntryItem";
import { ensureSchema, getSql, type Entry } from "@/lib/db";
import { nextLimit, parseListLimit } from "@/lib/listRange";

// 항상 최신 목록을 보여주도록 요청마다 렌더링
export const dynamic = "force-dynamic";

const DEVELOPER_NAME = "윤재건";
const STUDENT_ID = "202402424";

async function getEntries(limit: number) {
  await ensureSchema();
  const sql = getSql();
  // limit + 1개를 가져와 남은 글이 있는지 판단
  const [rowResult, countResult] = await Promise.all([
    sql`
      select id, name, message, created_at, updated_at
      from guestbook_entries
      order by created_at desc, id desc
      limit ${limit + 1}
    `,
    sql`select count(*)::int as total from guestbook_entries`,
  ]);
  const rows = rowResult as Entry[];
  const total = (countResult as { total: number }[])[0].total;
  return { entries: rows.slice(0, limit), hasMore: rows.length > limit, total };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const limit = parseListLimit((await searchParams).limit);
  const { entries, hasMore, total } = await getEntries(limit);

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
        <h2 className="text-lg font-semibold">전체 글 ({total})</h2>
        {entries.length === 0 ? (
          <p className="text-gray-500">아직 작성된 글이 없습니다. 첫 글을 남겨보세요!</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <EntryItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
        {hasMore && (
          <div className="flex justify-center">
            <Link href={`/?limit=${nextLimit(limit)}`} scroll={false} className="btn-secondary">
              더 보기
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
