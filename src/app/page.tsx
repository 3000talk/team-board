"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEFAULT_BOARD_ID, DEFAULT_BOARD_TITLE } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ensureBoard } from "@/lib/boardApi";

// 루트(첫 화면)에 들어오면 버튼 없이 곧바로 보드로 자동 이동합니다.
// - 보드가 없으면 자동 생성(직원 6명 포함) 후 이동
// - 이미 있으면 바로 그 보드로 이동
export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function go() {
      if (!isSupabaseConfigured) {
        setError(
          "Supabase 설정이 아직 없습니다. .env.local 파일에 URL과 anon key를 입력한 뒤 서버를 다시 시작해 주세요."
        );
        return;
      }
      try {
        // 보드가 없으면 생성(제목은 개포도서관), 있으면 그대로 사용
        await ensureBoard(DEFAULT_BOARD_ID, DEFAULT_BOARD_TITLE);
        if (cancelled) return;
        // 중간 화면 없이 즉시 이동 (뒤로가기 시 루트로 안 돌아오게 replace 사용)
        router.replace(`/board/${encodeURIComponent(DEFAULT_BOARD_ID)}`);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            "보드로 이동하는 중 문제가 생겼습니다. SQL 마이그레이션을 실행했는지, 환경변수가 올바른지 확인해 주세요."
          );
        }
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {!error ? (
          <>
            <div className="mb-2 text-sm font-medium tracking-wide text-house">TEAM BOARD</div>
            <h1 className="mb-2 text-xl font-semibold text-forest">{DEFAULT_BOARD_TITLE}</h1>
            <p className="text-sm text-forest/60">보드로 이동 중입니다…</p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold text-forest">잠시 문제가 있어요</h1>
            <p className="mb-4 text-sm leading-relaxed text-forest/70">{error}</p>
            {isSupabaseConfigured && (
              <Link
                href={`/board/${encodeURIComponent(DEFAULT_BOARD_ID)}`}
                className="btn-primary"
              >
                보드로 직접 이동
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
