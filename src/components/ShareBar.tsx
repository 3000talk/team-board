"use client";

import { useState } from "react";

// 공유 링크 복사 바
export default function ShareBar({ boardId }: { boardId: string }) {
  const [copied, setCopied] = useState(false);

  // 현재 보고 있는 보드의 전체 URL (한글 slug는 인코딩)
  function getShareUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/board/${encodeURIComponent(boardId)}`;
  }

  async function handleCopy() {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한이 없을 때를 대비한 대체 방법
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="card mb-5 flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-forest/60">공유 링크</div>
        <div className="truncate text-sm text-forest">{getShareUrl()}</div>
      </div>
      <button onClick={handleCopy} className="btn-secondary shrink-0">
        {copied ? "복사됨!" : "공유 링크 복사"}
      </button>
    </div>
  );
}
