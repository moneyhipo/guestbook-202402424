# Spec: 방명록 번외 기능 (글자 수 · 좋아요 · 연속 실패 잠금 · 더 보기)

**Status:** implemented

## Problem Statement

필수 CRUD는 동작하지만, 방문자는 메시지를 쓰면서 1000자 한도까지 얼마나 남았는지 알 수 없다. 마음에 드는 글에 반응을 남길 방법도 없다. 글이 쌓이면 한 화면에 전부 펼쳐져 목록이 끝없이 길어진다. 글 비밀번호는 몇 번이든 틀릴 수 있어서, 누군가 다른 사람의 글 비밀번호를 무작정 대입해 볼 수 있다.

## Solution

- 작성 폼의 메시지 입력칸 아래에 현재 글자 수를 `N / 1000`으로 표시한다.
- 각 글에 좋아요 버튼과 좋아요 수를 보여준다. 한 브라우저에서 한 글에 한 번 누를 수 있고, 다시 누르면 취소된다.
- 목록은 최신순으로 처음 5개만 보여주고, 더 남아 있으면 "더 보기" 버튼으로 5개씩 이어서 보여준다.
- 한 글에 비밀번호 시도가 5번 연속 실패하면 그 글은 5초 동안 잠긴다. 잠긴 동안에는 수정·삭제 시도가 모두 거부되고 남은 시간이 안내된다.

## User Stories

1. As a 방문자, I want to see how many characters I've typed in my message, so that I know how much room is left before the 1000-character limit.
2. As a 방문자, I want the character count to update as I type, so that I don't have to guess.
3. As a 방문자, I want the character count to go back to 0 after my 글 is posted, so that the form looks fresh for the next 글.
4. As a 방문자, I want to see each 글's 좋아요 수, so that I can tell which 글 others liked.
5. As a 방문자, I want to press 좋아요 on a 글, so that I can show I liked it without writing anything.
6. As a 방문자, I want the button to show that I've already liked a 글, so that I don't wonder whether my 좋아요 counted.
7. As a 방문자, I want to press 좋아요 again to cancel it, so that I can undo a mistaken 좋아요.
8. As a 방문자, I want my 좋아요 state to survive a page refresh, so that I can't accidentally like the same 글 twice.
9. As a 방문자, I want the 좋아요 수 to never go below 0, so that the number always makes sense.
10. As a 방문자, I want 좋아요 to work without any 글 비밀번호, so that anyone can react.
11. As a 방문자, I want to see only the 5 newest 글 at first, so that the page loads short and fast.
12. As a 방문자, I want a "더 보기" button when older 글 exist, so that I can keep reading.
13. As a 방문자, I want each "더 보기" press to add the next 5 older 글 below the current ones, so that I keep my place.
14. As a 방문자, I want the "더 보기" button to disappear when there are no more 글, so that I know I've reached the end.
15. As a 방문자, I want the total 글 count to still reflect every 글, so that I know how big the guestbook is.
16. As a 방문자, I want the list range I opened to stay the same after I post, edit, delete or refresh, so that I don't lose my place.
16-1. As a 방문자, I want a "접기" button once I've opened more than the first 5 글, so that I can go back to the short list (refresh alone keeps the opened range). _(added after review, user feedback)_
17. As a 글쓴이, I want a wrong password to tell me how many 비밀번호 시도 I have left, so that I'm careful before I get locked.
18. As a 글쓴이, I want my 연속 실패 to reset when I enter the right password, so that past typos don't count against me.
19. As a 글쓴이, I want a 잠금 to last only 5 seconds, so that I can retry quickly if it was just me mistyping.
20. As a 글쓴이, I want the lock message to tell me how many seconds remain, so that I know when to retry.
21. As a 글쓴이, I want edit and delete attempts to share one 연속 실패 count, so that switching buttons doesn't bypass the limit.
22. As a 글쓴이, I want a 잠금 on my 글 to leave other 글 unaffected, so that one attacked 글 doesn't block the whole guestbook.
23. As a 글쓴이, I want a locked 글 to still be readable and likeable, so that the 잠금 only protects edit/delete.
24. As a 글쓴이, I want attempts made during a 잠금 not to extend or count toward the next 잠금, so that the rule is predictable.
25. As a 글쓴이, I want the correct password to also be rejected during a 잠금, so that an attacker can't slip in a guess while locked.

## Implementation Decisions

- **Schema**: the 글 table gains three columns: 좋아요 수 (integer, default 0, never negative), 연속 실패 count (integer, default 0), and 잠금 해제 시각 (nullable timestamp). The app adds them idempotently at startup (`add column if not exists`), so existing deployments migrate without a manual step. The same SQL is kept in the repo's schema file for the Neon SQL Editor.
- **Lockout policy module (new, pure)**: a small deep module that owns the 잠금 rule and knows nothing about the DB. Interface, in prose: given the current 잠금 state (연속 실패 count + 잠금 해제 시각) and "now", say whether an attempt is allowed and how many ms remain; given a failed attempt, return the next state and whether it just locked; the success state is "0 failures, no lock". Constants: 5 failures, 5 000 ms. On the 5th failure the count resets to 0 and the lock time is set.
- **Password check in the server actions**: reads the 잠금 state together with the password hash. It rejects immediately while locked, without comparing the password. On a mismatch it persists the next state. On a match it resets the state in the same statement that performs the update/delete.
- **Error messages** (shown in the existing red notice): `비밀번호가 일치하지 않습니다. (남은 시도 N회)`, `비밀번호를 5회 틀려 5초간 잠겼습니다.`, `잠시 후 다시 시도하세요. (N초 남음)`.
- **좋아요 action (new)**: takes a 글 id and whether to add or cancel. It changes the 좋아요 수 by ±1 atomically in SQL, clamped at 0, and returns the new count. Missing 글 → error result.
- **좋아요 client state**: the set of liked 글 ids lives in the browser's localStorage (ADR-0002). The count updates optimistically and reconciles with the returned count.
- **List range policy module (new, pure)**: parses the `limit` search param into a safe number of 글 to show. Default 5. Rounds up to a multiple of 5. Clamped to [5, 500]. Garbage input → default.
- **Home page**: reads `limit`, fetches `limit + 1` newest 글 to learn whether more exist, and shows the total count from a separate `count(*)`. "더 보기" is a link to the same page with `limit + 5` that does not scroll to the top. It is hidden when no 글 remain or the 500 cap is reached. "접기" links back to the first 5 and appears only when more than 5 are open.
- **Character count**: the create form tracks the message length and shows `N / 1000` in plain gray text. No color states. It resets on successful post.

## Testing Decisions

- A good test drives a module through its public interface and asserts outcomes a user would recognise (allowed/denied, seconds remaining, how many 글 shown). It never inspects internals.
- **Agreed seams** (the highest seams that don't require a live database):
  1. The lockout policy module: sequences of failures/successes/time passing → allowed or denied, and remaining ms.
  2. The list range policy module: raw `limit` input → number of 글 to show.
- Server actions and UI are verified by a manual run against the real Neon DB (local dev + deployed site), not by mocking the SQL client. Mocking it would couple tests to query text.
- Test runner: Vitest (no prior art in the repo; this spec introduces the first tests).

## Out of Scope

- Server-side identification of who liked what (accounts, IP or cookie records).
- IP-based or global rate limiting.
- Infinite scroll, numbered pages.
- Character count on the edit form or the name field; color warnings.
- Retroactive change of the 1000-character limit.

## Further Notes

- The 5-second 잠금 is deliberately short for a class demo. The constant lives in the lockout policy module and can be raised to minutes in one edit.
- See ADR-0001 (잠금 state in DB) and ADR-0002 (좋아요 dedup in browser).
