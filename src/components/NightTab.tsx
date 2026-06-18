"use client";

import { useMemo, useState } from "react";
import type { BoardData, Employee } from "@/lib/types";
import {
  assignmentForDate,
  buildOverrideMap,
  countFairness,
  orderedEmployees,
} from "@/lib/nightRotation";
import { buildMonthGrid, formatDate, isWeekend } from "@/lib/dateUtils";
import {
  clearNightOverride,
  setNightOverride,
  updateNightStartDate,
} from "@/lib/boardApi";
import Modal from "./Modal";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// 탭2: 야간 순환근무 (월 단위 달력)
export default function NightTab({
  data,
  runMutation,
}: {
  data: BoardData;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [picked, setPicked] = useState<Date | null>(null); // 클릭한 날짜(스왑 모달용)

  const employees = useMemo(() => orderedEmployees(data.employees), [data.employees]);
  const overrideMap = useMemo(() => buildOverrideMap(data.overrides), [data.overrides]);
  const startDateStr = data.schedule.night_start_date;

  const grid = useMemo(() => buildMonthGrid(year, month0), [year, month0]);

  // 이번 달(실제 month0)에 속하는 날짜만 모아 공평성 카운트
  const monthDates = useMemo(
    () => grid.filter((d) => d.getMonth() === month0),
    [grid, month0]
  );
  const fairness = useMemo(
    () => countFairness(monthDates, startDateStr, employees, overrideMap),
    [monthDates, startDateStr, employees, overrideMap]
  );

  function prevMonth() {
    const d = new Date(year, month0 - 1, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }
  function nextMonth() {
    const d = new Date(year, month0 + 1, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth0(today.getMonth());
  }

  return (
    <section>
      {/* 상단 컨트롤: 순환 시작일 */}
      <div className="card mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <label className="text-sm font-medium text-forest">순환 시작일</label>
        <input
          type="date"
          value={startDateStr ?? ""}
          onChange={(e) =>
            runMutation(() =>
              updateNightStartDate(data.schedule.id, e.target.value || null)
            )
          }
          className="rounded-cell border border-line bg-cream px-3 py-1.5 text-sm text-forest focus:border-house focus:outline-none"
        />
        <span className="text-xs text-forest/50">
          이 날짜부터 평일조/주말조가 각각 순서대로 자동 배정됩니다.
        </span>
      </div>

      {!startDateStr && (
        <div className="mb-4 rounded-cell border border-line bg-mint/30 px-3 py-2 text-sm text-forest/70">
          먼저 <strong>순환 시작일</strong>을 지정하면 달력에 야간근무자가 자동으로 채워집니다.
        </div>
      )}

      {/* 달 이동 */}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={prevMonth} className="btn-secondary px-3" aria-label="이전 달">
          ‹
        </button>
        <h2 className="min-w-[120px] text-center text-lg font-semibold text-forest">
          {year}년 {month0 + 1}월
        </h2>
        <button onClick={nextMonth} className="btn-secondary px-3" aria-label="다음 달">
          ›
        </button>
        <button onClick={goToday} className="btn-secondary ml-1">
          오늘
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-center text-xs font-medium ${
              i >= 5 ? "text-house" : "text-forest/60"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {grid.map((date) => {
          const inMonth = date.getMonth() === month0;
          const weekend = isWeekend(date);
          const a = assignmentForDate(date, startDateStr, employees, overrideMap);
          const isToday = formatDate(date) === formatDate(today);

          return (
            <button
              key={formatDate(date)}
              onClick={() => setPicked(date)}
              className={`flex min-h-[64px] flex-col items-stretch gap-1 rounded-cell border p-1.5 text-left transition-colors sm:min-h-[84px] ${
                weekend ? "border-line bg-mint/40" : "border-line bg-white"
              } ${inMonth ? "" : "opacity-40"} ${
                isToday ? "ring-2 ring-house ring-offset-1" : ""
              } hover:border-house`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${weekend ? "text-house" : "text-forest/70"}`}>
                  {date.getDate()}
                </span>
                {a.isOverride && (
                  <span className="text-[10px] text-house" title="수동 지정">
                    ✎
                  </span>
                )}
              </div>
              {a.employee && (
                <span
                  className="truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: a.employee.color }}
                  title={a.employee.name}
                >
                  {a.employee.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 공평성 카운트 */}
      <FairnessTable employees={employees} fairness={fairness} monthLabel={`${month0 + 1}월`} />

      {/* 날짜 클릭 -> 수동 교체 모달 */}
      {picked && (
        <SwapModal
          date={picked}
          boardId={data.schedule.id}
          employees={employees}
          assignment={assignmentForDate(picked, startDateStr, employees, overrideMap)}
          runMutation={runMutation}
          onClose={() => setPicked(null)}
        />
      )}
    </section>
  );
}

// 평일조/주말조 사람별 횟수 표
function FairnessTable({
  employees,
  fairness,
  monthLabel,
}: {
  employees: Employee[];
  fairness: { weekday: Record<string, number>; weekend: Record<string, number> };
  monthLabel: string;
}) {
  return (
    <div className="card mt-5 p-4">
      <div className="mb-2 text-xs font-medium text-forest/60">
        {monthLabel} 야간근무 횟수 (공평성 확인용)
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["weekday", "weekend"] as const).map((cycle) => (
          <div key={cycle}>
            <div className="mb-1.5 text-xs font-semibold text-house">
              {cycle === "weekday" ? "평일조 (월~금)" : "주말조 (토·일)"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {employees.map((emp) => (
                <span
                  key={emp.id}
                  className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs text-forest"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: emp.color }} />
                  {emp.name}
                  <strong className="text-house">{fairness[cycle][emp.id] ?? 0}</strong>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 날짜 클릭 시: 그 날 근무자 수동 교체 / 자동으로 되돌리기
function SwapModal({
  date,
  boardId,
  employees,
  assignment,
  runMutation,
  onClose,
}: {
  date: Date;
  boardId: string;
  employees: Employee[];
  assignment: ReturnType<typeof assignmentForDate>;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
  onClose: () => void;
}) {
  const dateStr = formatDate(date);
  const weekend = isWeekend(date);

  async function pick(empId: string) {
    await runMutation(() => setNightOverride(boardId, dateStr, empId));
    onClose();
  }
  async function reset() {
    await runMutation(() => clearNightOverride(boardId, dateStr));
    onClose();
  }

  return (
    <Modal title={`${dateStr} (${weekend ? "주말조" : "평일조"})`} onClose={onClose}>
      <p className="mb-3 text-sm text-forest/70">
        현재 근무자:{" "}
        <strong className="text-forest">
          {assignment.employee ? assignment.employee.name : "없음"}
        </strong>
        {assignment.isOverride && (
          <span className="ml-1 text-xs text-house">(수동 지정됨)</span>
        )}
      </p>

      <div className="mb-1 text-xs font-medium text-forest/60">근무자 직접 지정</div>
      <div className="flex flex-wrap gap-2">
        {employees.map((emp) => {
          const active = assignment.employee?.id === emp.id;
          return (
            <button
              key={emp.id}
              onClick={() => pick(emp.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active ? "border-house bg-mint/50" : "border-line bg-white hover:bg-mint/30"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: emp.color }} />
              {emp.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          onClick={reset}
          disabled={!assignment.isOverride}
          className="btn-secondary disabled:opacity-40"
          title="자동 배정 규칙으로 되돌립니다"
        >
          자동으로 되돌리기
        </button>
        <button onClick={onClose} className="btn-primary">
          닫기
        </button>
      </div>
    </Modal>
  );
}
