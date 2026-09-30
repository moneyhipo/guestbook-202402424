# /code-review: 91400ba...HEAD (TICKET 01~05)

Standards와 Spec 두 관점을 병렬 서브에이전트로 따로 리뷰한 결과와 조치.

## Standards

| 지적 | 구분 | 조치 |
|---|---|---|
| ESLint `react-hooks/set-state-in-effect` 2건 (LikeButton) | 도구 오류 | `useSyncExternalStore` + `useOptimistic`으로 재작성 |
| LikeButton 실패 시 처음 렌더 값으로 롤백 | 버그(경미) | `useOptimistic`이 서버 값으로 자동 복귀 |
| `toggleLike`가 실제로는 set/unset (Mysterious Name) | 스멜 | `setLike`로 이름 변경 |
| `PAGE_SIZE`가 용어집이 피하는 "페이지" 개념 | 용어집 | `SHOW_MORE_STEP`으로 이름 변경 |
| 좋아요 prop `likes` / state `count` 불일치 | 스멜 | `likeCount`로 통일 |
| `limit+1`과 `count(*)`로 남은 글을 두 번 판단 (Duplicated Code) | 스멜 | `total` 하나로 판단, 반환 타입 복원 |
| 성공 시 초기화 SQL이 액션에 흩어짐 (Feature Envy) | 스멜 | `recordSuccess()`를 잠금 정책 모듈로 이동 |
| `db.ts` 마이그레이션 ↔ `db/schema.sql` 중복 | 스멜 | 유지 (SQL Editor용 사본, 주석으로 명시) |

## Spec

| 지적 | 조치 |
|---|---|
| 글이 500개를 넘으면 "더 보기"가 사라지지 않고 눌러도 그대로 (US14) | `nextLimit`이 한도에서 null 반환, 테스트 추가 |
| "성공하면 초기화" 테스트가 아무것도 검증하지 않음 (티켓 05) | 4회 실패 후 성공 → 다시 4회 남음을 검증하도록 교체 |
| US24(잠금 중 시도가 잠금을 늘리지 않음) 테스트 없음 | 테스트 추가 |
| `likes >= 0` DB 제약 없음 | 유지: 앱 경로에서 `greatest(...,0)`로 보장, 과제 범위 |
| `@types/node` 20 → 24 (스코프 밖) | 유지: Vitest 설치의 peer 의존성 요구, 실행 Node도 v24 |
| `setLike`의 `revalidatePath` (스코프 밖) | 유지: `useOptimistic`이 요청 후 서버 값으로 맞추는 데 필요 |

## 리뷰 이후 사용자 피드백

- 더 보기 상태가 새로고침 후에도 유지되어 되돌릴 방법이 없음 → "접기" 버튼 추가 (US16-1)
