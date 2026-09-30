# 01: 테스트 러너 준비 (prefactor)

**What to build:** 저장소에서 `npm run test` 한 번으로 순수 모듈 테스트를 돌릴 수 있게 한다. 이후 티켓(03, 05)이 합의된 seam에 테스트를 붙일 수 있도록 길을 먼저 닦는 작업이다.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Vitest가 dev 의존성으로 추가되고 `@/` 경로 별칭을 인식한다
- [x] `npm run test`가 테스트를 한 번 실행하고 종료한다 (watch 모드 아님)
- [x] 타입 검사와 `npm run build`가 여전히 통과한다
