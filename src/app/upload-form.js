"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${Math.ceil(bytes / 1024 / 1024)} MB`;
}

export default function UploadForm({ maxZipBytes }) {
  const inputRef = useRef(null);
  const changeSummaryRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  return (
    <form
      className="stack upload-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage("");

        const file = inputRef.current?.files?.[0];
        const changeSummary = changeSummaryRef.current?.value?.trim() || "";

        if (!changeSummary) {
          setMessage("변경 사항을 입력해주세요.");
          return;
        }
        if (!file) {
          setMessage("zip 파일을 선택해주세요.");
          return;
        }
        if (!file.name.endsWith(".zip")) {
          setMessage("zip 파일만 업로드할 수 있습니다.");
          return;
        }
        if (file.size > maxZipBytes) {
          setMessage(`zip 파일은 ${formatBytes(maxZipBytes)} 이하만 업로드할 수 있습니다.`);
          return;
        }

        try {
          setStatus("uploading");
          setProgress(0);

          const blob = await upload(`homepage-uploads/${Date.now()}-${file.name}`, file, {
            access: "private",
            handleUploadUrl: "/api/blob-upload",
            multipart: true,
            onUploadProgress: ({ percentage }) => {
              setProgress(Math.round(percentage));
            },
          });

          setStatus("publishing");
          const response = await fetch("/api/publish-blob", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ changeSummary, url: blob.url }),
          });

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "업로드를 반영하지 못했습니다.");
          }

          await response.json();
          window.location.href = new URL("/", window.location.href).href;
        } catch (error) {
          setStatus("idle");
          setMessage(error.message);
        }
      }}
    >
      <label>
        뭐가 변경되었나요?
        <textarea
          ref={changeSummaryRef}
          name="changeSummary"
          rows={3}
          maxLength={140}
          placeholder="예: 여름 프로그램 일정과 메인 배너 이미지 변경"
          required
        />
      </label>

      <label>
        홈페이지 zip 파일 ({formatBytes(maxZipBytes)} 이하)
        <input ref={inputRef} name="homepageZip" type="file" accept=".zip,application/zip" required />
      </label>

      {status !== "idle" ? (
        <div className="progress-wrap" aria-live="polite">
          <div className="progress-bar">
            <span style={{ width: `${status === "publishing" ? 100 : progress}%` }} />
          </div>
          <strong>{status === "uploading" ? `업로드 중 ${progress}%` : "배포 준비 중"}</strong>
        </div>
      ) : null}

      {message ? <p className="alert">{message}</p> : null}

      <button type="submit" disabled={status !== "idle"}>
        {status === "idle" ? "업로드" : "처리 중"}
      </button>
    </form>
  );
}
