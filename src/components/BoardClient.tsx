"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchBoard } from "@/lib/boardApi";
import type { BoardData } from "@/lib/types";
import ShareBar from "./ShareBar";
import StatusPill from "./StatusPill";
import ScheduleTab from "./ScheduleTab";
import NightTab from "./NightTab";

type Tab = "schedule" | "night";
type SyncState = "connecting" | "live" | "offline";

export default function BoardClient({ boardId }: { boardId: string }) {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("schedule");
  const [saving, setSaving] = useState(false);
  const [sync, setSync] = useState<SyncState>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 잦은 realtime 이벤트를 살짝 모아서 한 번에 새로고침하기 위한 타이머
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await fetchBoard(boardId);
      if (!d) {
        setNotFound(true);
      } else {
        setData(d);
        setNotFound(false);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("데이터를 불러오지 못했습니다. 새로고침해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  // 변경(쓰기) 작업을 감싸는 헬퍼: 저장중 표시 + 즉시 새로고침
  const runMutation = useCallback(
    async (fn: () => Promise<void>) => {
      setSaving(true);
      setErrorMsg(null);
      try {
        await fn();
        await reload();
      } catch (e) {
        console.error(e);
        setErrorMsg("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setSaving(false);
      }
    },
    [reload]
  );

  // 최초 로딩
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setSync("offline");
      return;
    }
    reload();
  }, [reload]);

  // Realtime 구독: 이 보드와 관련된 4개 테이블의 변경을 듣고, 바뀌면 새로고침
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const scheduleRunReload = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => reload(), 150);
    };

    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules", filter: `id=eq.${boardId}` },
        scheduleRunReload
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees", filter: `schedule_id=eq.${boardId}` },
        scheduleRunReload
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries", filter: `schedule_id=eq.${boardId}` },
        scheduleRunReload
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "night_overrides", filter: `schedule_id=eq.${boardId}` },
        scheduleRunReload
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSync("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSync("offline");
        else setSync("connecting");
      });

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [boardId, reload]);

  // ── 설정이 없을 때 ──
  if (!isSupabaseConfigured) {
    return (
      <CenterCard>
        <h2 className="mb-2 text-lg font-semibold text-forest">Supabase 설정이 필요합니다</h2>
        <p className="text-sm leading-relaxed text-forest/70">
          <code className="rounded bg-cream px-1">.env.local</code> 파일에 URL과 anon key를
          입력한 뒤 개발 서버를 다시 시작해 주세요.
        </p>
        <Link href="/" className="btn-secondary mt-6">
          처음 화면으로
        </Link>
      </CenterCard>
    );
  }

  // ── 로딩 ──
  if (loading) {
    return (
      <CenterCard>
        <p className="text-sm text-forest/60">불러오는 중…</p>
      </CenterCard>
    );
  }

  // ── 보드 없음 ──
  if (notFound || !data) {
    return (
      <CenterCard>
        <h2 className="mb-2 text-lg font-semibold text-forest">
          &lsquo;{boardId}&rsquo; 팀표를 찾을 수 없습니다
        </h2>
        <p className="text-sm text-forest/70">처음 화면에서 새 팀표를 만들어 주세요.</p>
        <Link href="/" className="btn-primary mt-6">
          처음 화면으로
        </Link>
      </CenterCard>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 바 */}
      <header className="bg-house text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <Link href="/" className="text-xs font-medium text-white/70 hover:text-white">
            TEAM BOARD
          </Link>
          <h1 className="text-lg font-semibold">{data.schedule.title || boardId}</h1>
          <div className="ml-auto flex items-center gap-2">
            <StatusPill sync={sync} saving={saving} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <ShareBar boardId={boardId} />

        {errorMsg && (
          <div className="mb-4 rounded-cell border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* 탭 버튼 */}
        <div className="mb-5 inline-flex rounded-cell border border-line bg-white p-1">
          <TabButton active={tab === "schedule"} onClick={() => setTab("schedule")}>
            일정표
          </TabButton>
          <TabButton active={tab === "night"} onClick={() => setTab("night")}>
            야간 순환근무
          </TabButton>
        </div>

        {tab === "schedule" ? (
          <ScheduleTab data={data} runMutation={runMutation} />
        ) : (
          <NightTab data={data} runMutation={runMutation} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[7px] px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-house text-white" : "text-forest/70 hover:text-forest"
      }`}
    >
      {children}
    </button>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">{children}</div>
    </main>
  );
}
