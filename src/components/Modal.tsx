"use client";

import { useEffect } from "react";

// 화면 가운데에 뜨는 공용 모달(팝오버)
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/30 px-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-forest">{title}</h3>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full px-2 text-xl leading-none text-forest/50 hover:text-forest"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
