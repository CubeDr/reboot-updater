"use client";

export default function RestoreForm({ sha }) {
  return (
    <form
      method="post"
      action="/api/restore"
      onSubmit={(event) => {
        const ok = window.confirm("선택한 버전으로 홈페이지를 복원할까요? 이 작업은 main 브랜치에 새 복원 커밋을 만듭니다.");
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="sha" value={sha} />
      <button className="secondary" type="submit">
        이 버전으로 복원
      </button>
    </form>
  );
}
