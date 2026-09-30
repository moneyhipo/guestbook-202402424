// 목록에 보여줄 글 개수 정책 (?limit= 검색 파라미터 해석)
export const PAGE_SIZE = 5;
const MAX_LIMIT = 500;

export function parseListLimit(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return PAGE_SIZE;
  const rounded = Math.ceil(value / PAGE_SIZE) * PAGE_SIZE;
  return Math.min(rounded, MAX_LIMIT);
}

export function nextLimit(limit: number): number {
  return limit + PAGE_SIZE;
}
