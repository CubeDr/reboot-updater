"use client";

import { useState } from "react";

export default function PromoteForm({ disabled }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      method="post"
      action="/api/promote-preview"
      onSubmit={(event) => {
        const ok = window.confirm("현재 미리보기 버전을 실제 홈페이지에 배포할까요?");
        if (!ok) {
          event.preventDefault();
          return;
        }
        setIsSubmitting(true);
      }}
    >
      <button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "배포 중" : "확정 배포"}
      </button>
    </form>
  );
}
