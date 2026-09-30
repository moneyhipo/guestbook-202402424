// 목록에 보여줄 글 개수 정책 (?limit= 검색 파라미터 해석, 더 보기 / 접기)
export const SHOW_MORE_STEP = 5;
const MAX_LIMIT = 500;

export function parseListLimit(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return SHOW_MORE_STEP;
  const rounded = Math.ceil(value / SHOW_MORE_STEP) * SHOW_MORE_STEP;
  return Math.min(rounded, MAX_LIMIT);
}

// 더 보기로 넘어갈 limit. 남은 글이 없거나 한도에 닿았으면 null
export function nextLimit(limit: number, total: number): number | null {
  if (total <= limit || limit >= MAX_LIMIT) return null;
  return limit + SHOW_MORE_STEP;
}

export function canCollapse(limit: number): boolean {
  return limit > SHOW_MORE_STEP;
}
