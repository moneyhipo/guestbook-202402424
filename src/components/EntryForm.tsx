"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createEntry, type ActionResult } from "@/app/actions";

export default function EntryForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createEntry, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [messageLength, setMessageLength] = useState(0);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} onReset={() => setMessageLength(0)} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">새 글 남기기</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input name="name" placeholder="이름" maxLength={50} required className="input sm:flex-1" />
        <input name="password" type="password" placeholder="비밀번호 (수정·삭제용, 4자 이상)" minLength={4} required className="input sm:flex-1" />
      </div>
      <div>
        <textarea
          name="message"
          placeholder="메시지를 입력하세요"
          maxLength={1000}
          required
          rows={3}
          onChange={(e) => setMessageLength(e.target.value.length)}
          className="input w-full"
        />
        <p className="text-right text-xs text-gray-500">{messageLength} / 1000</p>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${state?.ok ? "text-green-600" : "text-red-600"}`} role="status">
          {state?.ok ? "등록되었습니다." : state?.error}
        </p>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "등록 중..." : "등록"}
        </button>
      </div>
    </form>
  );
}
