"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_BOARD_ID } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ensureBoard } from "@/lib/boardApi";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!isSupabaseConfigured) {
      setError(
        "Supabase 설정이 아직 없습니다. .env.local 파일에 URL과 anon key를 입력한 뒤 서버를 다시 시작해 주세요."
      );
      return;
    }
    setLoading(true);
    try {
      // id="개포도서관" 보드가 없으면 만들고, 있으면 그대로 이동 (중복 생성 방지)
      await ensureBoard(DEFAULT_BOARD_ID, DEFAULT_BOARD_ID);
      // 한글 slug가 URL에서 깨지지 않도록 인코딩
      router.push(`/board/${encodeURIComponent(DEFAULT_BOARD_ID)}`);
    } catch (e) {
      console.error(e);
      setError(
        "보드를 만드는 중 문제가 생겼습니다. SQL 마이그레이션을 실행했는지, 환경변수가 올바른지 확인해 주세요."
      );
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mb-2 text-sm font-medium tracking-wide text-house">
          TEAM BOARD
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-forest">
          실시간 공유 팀 관리
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-forest/70">
          일정표와 야간 순환근무를 한 곳에서 관리하고,
          <br />
          공유 링크로 팀원들과 실시간으로 함께 편집하세요.
        </p>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-primary w-full py-3 text-base"
        >
          {loading ? "준비 중…" : "새 팀표 만들기"}
        </button>

        <p className="mt-4 text-xs text-forest/50">
          팀표 ID:{" "}
          <span className="font-medium text-house">{DEFAULT_BOARD_ID}</span>
          <br />
          이미 만들어져 있으면 그 보드로 바로 이동합니다.
        </p>

        {!isSupabaseConfigured && (
          <div className="mt-6 rounded-cell border border-line bg-cream p-3 text-left text-xs leading-relaxed text-forest/70">
            <strong className="text-house">설정 필요:</strong> 아직 Supabase가
            연결되지 않았습니다.{" "}
            <code className="rounded bg-white px-1">.env.local</code> 파일에{" "}
            <code className="rounded bg-white px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            와{" "}
            <code className="rounded bg-white px-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            를 입력하고 서버를 다시 시작하세요.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-cell border border-red-200 bg-red-50 p-3 text-left text-xs leading-relaxed text-red-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
