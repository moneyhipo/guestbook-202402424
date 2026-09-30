"use client";

import { useCallback, useState } from "react";
import DinoGame from "@/components/DinoGame";

export default function DeveloperName({ name, studentId }: { name: string; studentId: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <p className="text-sm text-gray-600">
        개발자:{" "}
        <span onClick={() => setOpen((v) => !v)} className="cursor-default">
          {name}
        </span>{" "}
        ({studentId})
      </p>
      {open && <DinoGame onClose={close} />}
    </>
  );
}
