import type { Employee, SmartOverride } from "./types";
import { SMART_LIBRARY_SORT_ORDERS, SMART_LIBRARY_WEEKDAYS } from "./constants";
import {
  parseDate,
  formatDate,
  dayDiff,
  countSpecificWeekdaysExclusive,
} from "./dateUtils";

// ============================================================
//  스마트도서관(탭3) 배정 로직
//  - 매주 화(2)·금(5)에만 1명 배정
//  - 참여자 4명을 sort_order 기준으로 고정(서재은→윤송주→홍수진→이수현)
//  - 시작일부터 그 날 직전까지의 "화·금" 개수 % 4 번째 사람
//  - 수동 교체(override)가 있으면 그 값이 우선
// ============================================================

export interface SmartAssignment {
  dateStr: string;
  employee: Employee | null;
  isActiveDay: boolean; // 화·금 여부
  isOverride: boolean; // 수동 교체된 날인지
}

// 순환에 참여하는 4명을 지정된 순서대로 반환
export function smartRotationEmployees(employees: Employee[]): Employee[] {
  const result: Employee[] = [];
  for (const so of SMART_LIBRARY_SORT_ORDERS) {
    const emp = employees.find((e) => e.sort_order === so);
    if (emp) result.push(emp);
  }
  return result;
}

// 그 날이 "그 달의 마지막 화요일"인지 (= 촬영 날)
export function isFilmingDate(date: Date): boolean {
  if (date.getDay() !== 2) return false; // 화요일(2)만
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() + 7 > daysInMonth; // 7일 뒤가 다음 달이면 마지막 화요일
}

export function buildSmartOverrideMap(overrides: SmartOverride[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const o of overrides) map.set(o.date, o.employee_id);
  return map;
}

export function smartAssignmentForDate(
  date: Date,
  startDateStr: string | null,
  employees: Employee[],
  overrideMap: Map<string, string>
): SmartAssignment {
  const dateStr = formatDate(date);
  const isActiveDay = SMART_LIBRARY_WEEKDAYS.includes(date.getDay());
  const list = smartRotationEmployees(employees);

  // 화·금이 아니면 배정 없음
  if (!isActiveDay) {
    return { dateStr, employee: null, isActiveDay: false, isOverride: false };
  }

  // 수동 교체분 우선
  const overrideEmpId = overrideMap.get(dateStr);
  if (overrideEmpId) {
    const emp = employees.find((e) => e.id === overrideEmpId) ?? null;
    return { dateStr, employee: emp, isActiveDay: true, isOverride: true };
  }

  // 시작일 없거나 이전이면 배정 없음
  if (!startDateStr || list.length === 0) {
    return { dateStr, employee: null, isActiveDay: true, isOverride: false };
  }
  const start = parseDate(startDateStr);
  if (dayDiff(start, date) < 0) {
    return { dateStr, employee: null, isActiveDay: true, isOverride: false };
  }

  const n = countSpecificWeekdaysExclusive(start, date, SMART_LIBRARY_WEEKDAYS);
  const idx = ((n % list.length) + list.length) % list.length;
  return { dateStr, employee: list[idx] ?? null, isActiveDay: true, isOverride: false };
}

// 사람별 배정 횟수 (공평성 확인용)
export function countSmartFairness(
  dates: Date[],
  startDateStr: string | null,
  employees: Employee[],
  overrideMap: Map<string, string>
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const emp of smartRotationEmployees(employees)) counts[emp.id] = 0;
  for (const d of dates) {
    // 촬영 날에도 기존 순번 담당자는 그대로 근무하므로 횟수에 포함
    const a = smartAssignmentForDate(d, startDateStr, employees, overrideMap);
    if (a.employee) counts[a.employee.id] = (counts[a.employee.id] ?? 0) + 1;
  }
  return counts;
}
