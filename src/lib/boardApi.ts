"use client";

import { supabase } from "./supabaseClient";
import { INITIAL_EMPLOYEES } from "./constants";
import type { BoardData, Category, Schedule } from "./types";

// 보드(팀표)가 이미 있는지 확인하고, 없으면 새로 만든다.
// 이미 있으면 중복 생성하지 않고 그대로 사용 -> 중복 생성 방지.
export async function ensureBoard(boardId: string, title: string): Promise<void> {
  const { data: existing, error: selErr } = await supabase
    .from("schedules")
    .select("id")
    .eq("id", boardId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) return; // 이미 존재 -> 그대로 이동

  // 1) schedules 행 생성
  const { error: insErr } = await supabase
    .from("schedules")
    .insert({ id: boardId, title });
  if (insErr) {
    // 동시에 다른 사람이 먼저 만들었을 수 있음(unique 충돌) -> 무시하고 진행
    if (insErr.code !== "23505") throw insErr;
    return;
  }

  // 2) 직원 6명 자동 생성
  const rows = INITIAL_EMPLOYEES.map((e, i) => ({
    schedule_id: boardId,
    name: e.name,
    color: e.color,
    sort_order: i,
  }));
  const { error: empErr } = await supabase.from("employees").insert(rows);
  if (empErr) throw empErr;
}

// 보드 하나를 그리는 데 필요한 모든 데이터를 한 번에 가져온다.
export async function fetchBoard(boardId: string): Promise<BoardData | null> {
  const { data: schedule, error: sErr } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", boardId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!schedule) return null;

  const [
    { data: employees, error: eErr },
    { data: entries, error: enErr },
    { data: overrides, error: oErr },
    { data: smartOverrides, error: soErr },
  ] = await Promise.all([
    supabase.from("employees").select("*").eq("schedule_id", boardId).order("sort_order"),
    supabase.from("entries").select("*").eq("schedule_id", boardId).order("created_at"),
    supabase.from("night_overrides").select("*").eq("schedule_id", boardId),
    supabase.from("smart_overrides").select("*").eq("schedule_id", boardId),
  ]);
  if (eErr) throw eErr;
  if (enErr) throw enErr;
  if (oErr) throw oErr;
  if (soErr) throw soErr;

  return {
    schedule: schedule as Schedule,
    employees: employees ?? [],
    entries: entries ?? [],
    overrides: overrides ?? [],
    smartOverrides: smartOverrides ?? [],
  };
}

// ── 직원 이름 수정 ──
export async function updateEmployeeName(employeeId: string, name: string) {
  const { error } = await supabase.from("employees").update({ name }).eq("id", employeeId);
  if (error) throw error;
}

// ── 야간 순환 시작일 변경 ──
export async function updateNightStartDate(boardId: string, dateStr: string | null) {
  const { error } = await supabase
    .from("schedules")
    .update({ night_start_date: dateStr })
    .eq("id", boardId);
  if (error) throw error;
}

// ── 일정표 항목 추가 (날짜 기준) ──
export async function addEntry(
  boardId: string,
  date: string,
  category: Category,
  employeeId: string,
  content: string
) {
  const { error } = await supabase
    .from("entries")
    .insert({ schedule_id: boardId, date, employee_id: employeeId, category, content });
  if (error) throw error;
}

// ── 일정표 항목 수정 ──
export async function updateEntry(entryId: string, content: string) {
  const { error } = await supabase.from("entries").update({ content }).eq("id", entryId);
  if (error) throw error;
}

// ── 일정표 항목 삭제 ──
export async function deleteEntry(entryId: string) {
  const { error } = await supabase.from("entries").delete().eq("id", entryId);
  if (error) throw error;
}

// ── 야간근무 수동 교체(override) 저장: 같은 날짜가 있으면 갱신 ──
export async function setNightOverride(boardId: string, dateStr: string, employeeId: string) {
  const { error } = await supabase
    .from("night_overrides")
    .upsert(
      { schedule_id: boardId, date: dateStr, employee_id: employeeId },
      { onConflict: "schedule_id,date" }
    );
  if (error) throw error;
}

// ── 야간근무 수동 교체 해제: 다시 자동배정으로 ──
export async function clearNightOverride(boardId: string, dateStr: string) {
  const { error } = await supabase
    .from("night_overrides")
    .delete()
    .eq("schedule_id", boardId)
    .eq("date", dateStr);
  if (error) throw error;
}

// ── 스마트도서관 순환 시작일 변경 ──
export async function updateSmartStartDate(boardId: string, dateStr: string | null) {
  const { error } = await supabase
    .from("schedules")
    .update({ smart_start_date: dateStr })
    .eq("id", boardId);
  if (error) throw error;
}

// ── 스마트도서관 수동 교체 저장 ──
export async function setSmartOverride(boardId: string, dateStr: string, employeeId: string) {
  const { error } = await supabase
    .from("smart_overrides")
    .upsert(
      { schedule_id: boardId, date: dateStr, employee_id: employeeId },
      { onConflict: "schedule_id,date" }
    );
  if (error) throw error;
}

// ── 스마트도서관 수동 교체 해제 ──
export async function clearSmartOverride(boardId: string, dateStr: string) {
  const { error } = await supabase
    .from("smart_overrides")
    .delete()
    .eq("schedule_id", boardId)
    .eq("date", dateStr);
  if (error) throw error;
}
