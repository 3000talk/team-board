"use client";

import { useMemo, useState } from "react";
import type { BoardData, Employee } from "@/lib/types";
import {
  smartAssignmentForDate,
  buildSmartOverrideMap,
  countSmartFairness,
  smartRotationEmployees,
  isFilmingDate,
} from "@/lib/smartRotation";
import { buildMonthGrid, formatDate } from "@/lib/dateUtils";
import {
  SMART_OVERRIDE_COLOR,
  SMART_LIBRARY_WEEKDAYS,
  FILMING_COLOR,
  FILMING_LABEL,
} from "@/lib/constants";
import {
  clearSmartOverride,
  setSmartOverride,
  updateSmartStartDate,
} from "@/lib/boardApi";
import Modal from "./Modal";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 탭3: 스마트도서관 (매주 화·금만, 4명 순환, 월 단위 달력)
export default function SmartTab({
  data,
  runMutation,
}: {
  data: BoardData;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [picked, setPicked] = useState<Date | null>(null);

  const rotation = useMemo(() => smartRotationEmployees(data.employees), [data.employees]);
  const overrideMap = useMemo(
    () => buildSmartOverrideMap(data.smartOverrides),
    [data.smartOverrides]
  );
  const startDateStr = data.schedule.smart_start_date;

  const grid = useMemo(() => buildMonthGrid(year, month0), [year, month0]);
  const monthDates = useMemo(() => grid.filter((d) => d.getMonth() === month0), [grid, month0]);
  const fairness = useMemo(
    () => countSmartFairness(monthDates, startDateStr, data.employees, overrideMap),
    [monthDates, startDateStr, data.employees, overrideMap]
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
      {/* 상단: 순환 시작일 */}
      <div className="card mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
        <label className="text-sm font-medium text-forest">순환 시작일</label>
        <input
          type="date"
          value={startDateStr ?? ""}
          onChange={(e) =>
            runMutation(() => updateSmartStartDate(data.schedule.id, e.target.value || null))
          }
          className="rounded-cell border border-line bg-cream px-3 py-1.5 text-sm text-forest focus:border-house focus:outline-none"
        />
        <span className="text-xs text-forest/50">
          매주 <strong className="text-house">화·금</strong>에만 4명이 순서대로 배정됩니다.
        </span>
      </div>

      {/* 순환 멤버 안내 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-forest/60">
        <span className="font-medium">순환 멤버</span>
        {rotation.map((emp, i) => (
          <span key={emp.id} className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: emp.color }} />
            {emp.name}
            {i < rotation.length - 1 && <span className="ml-1 text-forest/30">→</span>}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SMART_OVERRIDE_COLOR }} />
          수동 변경됨
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FILMING_COLOR }} />
          촬영(마지막 주 화)
        </span>
      </div>

      {!startDateStr && (
        <div className="mb-4 rounded-cell border border-line bg-mint/30 px-3 py-2 text-sm text-forest/70">
          먼저 <strong>순환 시작일</strong>을 지정하면 화·금 칸에 담당자가 자동으로 채워집니다.
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
              i === 2 || i === 5 ? "text-house" : "text-forest/60"
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
          const active = SMART_LIBRARY_WEEKDAYS.includes(date.getDay());
          const filming = isFilmingDate(date); // 마지막 주 화요일 = 촬영
          const a = smartAssignmentForDate(date, startDateStr, data.employees, overrideMap);
          const isToday = formatDate(date) === formatDate(today);
          const chipColor = a.isOverride ? SMART_OVERRIDE_COLOR : a.employee?.color;

          return (
            <button
              key={formatDate(date)}
              onClick={() => active && setPicked(date)}
              disabled={!active}
              className={`flex min-h-[64px] flex-col items-stretch gap-1 rounded-cell border p-1.5 text-left transition-colors sm:min-h-[84px] ${
                active
                  ? "border-line hover:border-house"
                  : "cursor-default border-line bg-white"
              } ${active && !filming ? "bg-mint/40" : ""} ${inMonth ? "" : "opacity-40"} ${
                isToday ? "ring-2 ring-house ring-offset-1" : ""
              }`}
              style={filming ? { backgroundColor: `${FILMING_COLOR}33` } : undefined}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${active ? "text-house" : "text-forest/40"}`}
                >
                  {date.getDate()}
                </span>
                {a.isOverride && (
                  <span className="text-[10px]" style={{ color: SMART_OVERRIDE_COLOR }} title="수동 변경">
                    ✎
                  </span>
                )}
              </div>

              {/* 마지막 주 화요일이면 '촬영'을 먼저 표시 */}
              {filming && (
                <span
                  className="whitespace-nowrap rounded-md px-1 py-0.5 text-center text-[10px] font-semibold leading-tight text-forest"
                  style={{ backgroundColor: FILMING_COLOR }}
                >
                  {FILMING_LABEL}
                </span>
              )}

              {/* 기존 순번 담당자도 함께 표시 (촬영 날에도 중복 표기) */}
              {a.employee && (
                <span
                  className="whitespace-nowrap rounded-md px-1 py-0.5 text-center text-[10px] font-medium leading-tight text-white"
                  style={{ backgroundColor: chipColor }}
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
      <div className="card mt-5 p-4">
        <div className="mb-2 text-xs font-medium text-forest/60">
          {month0 + 1}월 담당 횟수 (공평성 확인용)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {rotation.map((emp) => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs text-forest"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: emp.color }} />
              {emp.name}
              <strong className="text-house">{fairness[emp.id] ?? 0}</strong>
            </span>
          ))}
        </div>
      </div>

      {picked && (
        <SmartSwapModal
          date={picked}
          boardId={data.schedule.id}
          rotation={rotation}
          assignment={smartAssignmentForDate(picked, startDateStr, data.employees, overrideMap)}
          runMutation={runMutation}
          onClose={() => setPicked(null)}
        />
      )}
    </section>
  );
}

// 화·금 날짜 클릭 시: 담당자 수동 교체 / 자동으로 되돌리기
function SmartSwapModal({
  date,
  boardId,
  rotation,
  assignment,
  runMutation,
  onClose,
}: {
  date: Date;
  boardId: string;
  rotation: Employee[];
  assignment: ReturnType<typeof smartAssignmentForDate>;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
  onClose: () => void;
}) {
  const dateStr = formatDate(date);
  const dow = WEEKDAY_LABELS[date.getDay()];

  async function pick(empId: string) {
    await runMutation(() => setSmartOverride(boardId, dateStr, empId));
    onClose();
  }
  async function reset() {
    await runMutation(() => clearSmartOverride(boardId, dateStr));
    onClose();
  }

  return (
    <Modal title={`${dateStr} (${dow}) · 스마트도서관`} onClose={onClose}>
      <p className="mb-3 text-sm text-forest/70">
        현재 담당자:{" "}
        <strong className="text-forest">
          {assignment.employee ? assignment.employee.name : "없음"}
        </strong>
        {assignment.isOverride && (
          <span className="ml-1 text-xs" style={{ color: SMART_OVERRIDE_COLOR }}>
            (수동 변경됨)
          </span>
        )}
      </p>

      <div className="mb-1 text-xs font-medium text-forest/60">담당자 직접 지정</div>
      <div className="flex flex-wrap gap-2">
        {rotation.map((emp) => {
          const activeSel = assignment.employee?.id === emp.id;
          return (
            <button
              key={emp.id}
              onClick={() => pick(emp.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                activeSel ? "border-house bg-mint/50" : "border-line bg-white hover:bg-mint/30"
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
