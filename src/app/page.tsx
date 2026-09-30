import Link from "next/link";
import DeveloperName from "@/components/DeveloperName";
import EntryForm from "@/components/EntryForm";
import EntryItem from "@/components/EntryItem";
import { ensureSchema, getSql, type Entry } from "@/lib/db";
import { canCollapse, nextLimit, parseListLimit } from "@/lib/listRange";

// 항상 최신 목록을 보여주도록 요청마다 렌더링
export const dynamic = "force-dynamic";

const DEVELOPER_NAME = "윤재건";
const STUDENT_ID = "202402424";

async function getEntries(limit: number): Promise<{ entries: Entry[]; total: number }> {
  await ensureSchema();
  const sql = getSql();
  const [rows, counts] = await Promise.all([
    sql`
      select id, name, message, likes, created_at, updated_at
      from guestbook_entries
      order by created_at desc, id desc
      limit ${limit}
    `,
    sql`select count(*)::int as total from guestbook_entries`,
  ]);
  return { entries: rows as Entry[], total: (counts as { total: number }[])[0].total };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const limit = parseListLimit((await searchParams).limit);
  const { entries, total } = await getEntries(limit);
  const moreLimit = nextLimit(limit, total);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">방명록</h1>
        <DeveloperName name={DEVELOPER_NAME} studentId={STUDENT_ID} />
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
        {(moreLimit || canCollapse(limit)) && (
          <div className="flex justify-center gap-2">
            {moreLimit && (
              <Link href={`/?limit=${moreLimit}`} scroll={false} className="btn-secondary">
                더 보기
              </Link>
            )}
            {canCollapse(limit) && (
              <Link href="/" scroll={false} className="btn-secondary">
                접기
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
