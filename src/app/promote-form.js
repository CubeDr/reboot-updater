"use client";

export default function PromoteForm() {
  return (
    <form
      method="post"
      action="/api/promote-preview"
      onSubmit={(event) => {
        const ok = window.confirm("현재 미리보기 버전을 실제 홈페이지에 배포할까요?");
        if (!ok) event.preventDefault();
      }}
    >
      <button type="submit">확정 배포</button>
    </form>
  );
}
