"use client";

import { useMemo, useState } from "react";
import type { BoardData, Category, Employee, Entry } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { addEntry, deleteEntry, updateEmployeeName } from "@/lib/boardApi";
import { orderedEmployees } from "@/lib/nightRotation";
import { formatDate, isWeekend } from "@/lib/dateUtils";
import Modal from "./Modal";

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 일정표에서 다룰 달 범위 (6월~12월). month0: 0=1월이므로 5~11.
const SCHEDULE_MONTHS = [5, 6, 7, 8, 9, 10, 11];

// 탭1: 일정표 (행=날짜, 열=교육/행사/연가) — 6월~12월 중 한 달씩 보기
export default function ScheduleTab({
  data,
  runMutation,
}: {
  data: BoardData;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
}) {
  const employees = useMemo(() => orderedEmployees(data.employees), [data.employees]);

  // 표시할 연도 (올해)
  const year = useMemo(() => new Date().getFullYear(), []);

  // 선택된 달 (기본: 오늘이 6~12월이면 그 달, 아니면 6월)
  const [month0, setMonth0] = useState<number>(() => {
    const m = new Date().getMonth();
    return SCHEDULE_MONTHS.includes(m) ? m : 5;
  });

  // 선택된 달의 날짜 목록. 단, 지난 날짜는 빼고 "오늘 이후"만 표시 →
  // 현재 달이면 맨 위 행이 오늘 날짜가 됩니다.
  const dates = useMemo(() => {
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    const all = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month0, i + 1));
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return all.filter((d) => d >= todayMidnight);
  }, [year, month0]);

  // 클릭한 셀 (날짜 + 카테고리)
  const [cellEdit, setCellEdit] = useState<{ date: Date; category: Category } | null>(null);

  // 빠른 조회용: 직원 id -> 직원
  const empById = useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of employees) m.set(e.id, e);
    return m;
  }, [employees]);

  // (날짜, 카테고리) -> 항목들
  function entriesFor(dateStr: string, category: Category): Entry[] {
    return data.entries.filter((e) => e.date === dateStr && e.category === category);
  }

  return (
    <section>
      {/* 팀원 칩 (클릭하면 그 자리에서 바로 이름 수정) */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-forest/60">팀원 (이름을 클릭해 수정)</span>
        {employees.map((emp) => (
          <EmployeeChip key={emp.id} employee={emp} runMutation={runMutation} />
        ))}
      </div>

      {/* 월 선택 (6월~12월) */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-forest/60">{year}년</span>
        {SCHEDULE_MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => setMonth0(m)}
            className={`rounded-cell px-3 py-1.5 text-sm font-medium transition-colors ${
              m === month0
                ? "bg-house text-white"
                : "border border-line bg-white text-forest/70 hover:bg-mint/30"
            }`}
          >
            {m + 1}월
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-forest/60">
        {CATEGORIES.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.headerBg }} />
            {c.label}
          </span>
        ))}
        <span className="ml-auto">칸을 누르면 팀원을 고르고 메모를 추가할 수 있어요.</span>
      </div>

      <div className="no-scrollbar overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-24 border-b border-r border-line bg-cream p-2.5 text-left text-sm font-medium text-forest">
                날짜
              </th>
              {CATEGORIES.map((c, i) => (
                <th
                  key={c.key}
                  className={`border-b border-line p-2.5 text-sm font-medium ${
                    i < CATEGORIES.length - 1 ? "border-r" : ""
                  }`}
                  style={{ backgroundColor: c.headerBg, color: c.headerText }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.length === 0 && (
              <tr>
                <td
                  colSpan={CATEGORIES.length + 1}
                  className="border-b border-line bg-white p-6 text-center text-sm text-forest/50"
                >
                  표시할 날짜가 없습니다. (이 달은 모두 지난 날짜예요)
                </td>
              </tr>
            )}
            {dates.map((date) => {
              const dateStr = formatDate(date);
              const weekend = isWeekend(date);
              return (
                <tr key={dateStr} className={weekend ? "bg-mint/40" : "bg-white"}>
                  <td
                    className={`whitespace-nowrap border-b border-r border-line p-2.5 text-sm font-medium ${
                      weekend ? "text-house" : "text-forest/80"
                    }`}
                  >
                    {date.getMonth() + 1}/{date.getDate()} ({KO_WEEKDAYS[date.getDay()]})
                  </td>
                  {CATEGORIES.map((c, i) => {
                    const items = entriesFor(dateStr, c.key);
                    return (
                      <td
                        key={c.key}
                        onClick={() => setCellEdit({ date, category: c.key })}
                        className={`cursor-pointer border-b border-line p-1.5 align-top hover:bg-house/5 ${
                          i < CATEGORIES.length - 1 ? "border-r" : ""
                        }`}
                      >
                        {items.length === 0 ? (
                          <span className="text-xs text-forest/25">+ 추가</span>
                        ) : (
                          <ul className="flex flex-wrap gap-1">
                            {items.map((it) => {
                              const emp = empById.get(it.employee_id);
                              return (
                                <li
                                  key={it.id}
                                  className="inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white"
                                  style={{ backgroundColor: emp?.color ?? "#6B8E6E" }}
                                  title={`${emp?.name ?? "?"} · ${it.content}`}
                                >
                                  <span className="truncate">
                                    {emp?.name ?? "?"}
                                    {it.content ? ` · ${it.content}` : ""}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("이 항목을 삭제할까요?")) {
                                        runMutation(() => deleteEntry(it.id));
                                      }
                                    }}
                                    className="ml-0.5 shrink-0 rounded-sm px-1 text-white/80 hover:bg-white/25 hover:text-white"
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    ×
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cellEdit && (
        <CellEditorModal
          date={cellEdit.date}
          category={cellEdit.category}
          entries={entriesFor(formatDate(cellEdit.date), cellEdit.category)}
          employees={employees}
          empById={empById}
          boardId={data.schedule.id}
          runMutation={runMutation}
          onClose={() => setCellEdit(null)}
        />
      )}
    </section>
  );
}

// ── 팀원 칩: 클릭하면 그 자리에서 인라인으로 이름 수정 → Supabase 저장 ──
function EmployeeChip({
  employee,
  runMutation,
}: {
  employee: Employee;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(employee.name);
  const [busy, setBusy] = useState(false);

  // 다른 사람이 실시간으로 이름을 바꿨을 때, 편집 중이 아니면 최신값 반영
  if (!editing && name !== employee.name) {
    setName(employee.name);
  }

  async function save() {
    const t = name.trim();
    setEditing(false);
    if (!t || t === employee.name) {
      setName(employee.name); // 빈 값/동일하면 원복
      return;
    }
    setBusy(true);
    await runMutation(() => updateEmployeeName(employee.id, t));
    setBusy(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-house bg-white px-2.5 py-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: employee.color }} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setName(employee.name);
              setEditing(false);
            }
          }}
          className="w-20 bg-transparent text-xs font-medium text-forest focus:outline-none"
        />
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        setName(employee.name);
        setEditing(true);
      }}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-forest hover:bg-mint/30 disabled:opacity-50"
      title="클릭해서 이름 수정"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: employee.color }} />
      {busy ? "저장 중…" : employee.name}
    </button>
  );
}

// ── 셀 편집 모달: 팀원 선택(드롭다운) + 메모 입력, 여러 건 추가/삭제 ──
function CellEditorModal({
  date,
  category,
  entries,
  employees,
  empById,
  boardId,
  runMutation,
  onClose,
}: {
  date: Date;
  category: Category;
  entries: Entry[];
  employees: Employee[];
  empById: Map<string, Employee>;
  boardId: string;
  runMutation: (fn: () => Promise<void>) => Promise<void>;
  onClose: () => void;
}) {
  const dateStr = formatDate(date);
  const [empId, setEmpId] = useState<string>(employees[0]?.id ?? "");
  const [memo, setMemo] = useState("");

  async function handleAdd() {
    if (!empId) return;
    await runMutation(() => addEntry(boardId, dateStr, category, empId, memo.trim()));
    setMemo("");
  }

  const titleLabel = `${date.getMonth() + 1}/${date.getDate()} (${KO_WEEKDAYS[date.getDay()]}) · ${category}`;

  return (
    <Modal title={titleLabel} onClose={onClose}>
      <div className="space-y-4">
        {/* 기존 항목 목록 */}
        {entries.length > 0 && (
          <ul className="space-y-2">
            {entries.map((it) => {
              const emp = empById.get(it.employee_id);
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-2 rounded-cell border border-line px-2 py-1.5"
                >
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: emp?.color ?? "#6B8E6E" }}
                  >
                    {emp?.name ?? "?"}
                  </span>
                  <span className="flex-1 text-sm text-forest">{it.content || "(메모 없음)"}</span>
                  <button
                    onClick={() => runMutation(() => deleteEntry(it.id))}
                    className="shrink-0 text-xs text-forest/50 hover:text-red-500"
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* 새 항목 추가 */}
        <div className="rounded-cell border border-line bg-cream p-3">
          <div className="mb-2 text-xs font-medium text-forest/60">새 항목 추가</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="rounded-cell border border-line bg-white px-2 py-2 text-sm text-forest focus:border-house focus:outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (예: 보안교육, 오후 반차)"
              className="flex-1 rounded-cell border border-line bg-white px-2 py-2 text-sm text-forest focus:border-house focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">
              닫기
            </button>
            <button onClick={handleAdd} disabled={!empId} className="btn-primary">
              추가
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
