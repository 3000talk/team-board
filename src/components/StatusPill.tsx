"use client";

// 우상단에 표시되는 작은 동기화 상태 배지
export default function StatusPill({
  sync,
  saving,
}: {
  sync: "connecting" | "live" | "offline";
  saving: boolean;
}) {
  let dot = "bg-white/60";
  let label = "연결 중…";

  if (saving) {
    dot = "bg-yellow-300 animate-pulse";
    label = "저장 중…";
  } else if (sync === "live") {
    dot = "bg-mint";
    label = "실시간 연결됨";
  } else if (sync === "offline") {
    dot = "bg-red-300";
    label = "오프라인";
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
