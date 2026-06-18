import type { Employee, NightOverride } from "./types";
import {
  parseDate,
  formatDate,
  isWeekend,
  dayDiff,
  countWeekdaysExclusive,
  countWeekendsExclusive,
} from "./dateUtils";

// ============================================================
//  야간 순환근무 자동 배정 로직 (가장 중요한 부분)
// ============================================================
//
//  규칙:
//   - 야간근무는 매일 1명.
//   - 평일조와 주말조 두 사이클이 "완전히 분리"되어 독립적으로 돈다.
//   - 둘 다 같은 6명 순서(sort_order 0~5)를 따른다.
//
//   평일 야간근무자:
//     시작일(start)부터 그 날(D) "직전까지"의 평일 개수를 N이라 할 때,
//     (N % 6)번째 사람.  => 시작일이 평일이면 그 날은 N=0 -> 0번 사람(첫 번째).
//   주말 야간근무자:
//     마찬가지로 시작일부터 D 직전까지의 "주말" 개수를 N이라 할 때,
//     (N % 6)번째 사람.
//
//   즉 평일 포인터는 평일에만, 주말 포인터는 주말에만 한 칸씩 전진한다.
//
//  override(수동 교체)가 있으면 그 값이 자동배정보다 우선한다.
// ============================================================

export interface NightAssignment {
  dateStr: string; // 'YYYY-MM-DD'
  employee: Employee | null;
  isWeekend: boolean;
  isOverride: boolean; // 수동 교체된 날인지
}

// sort_order 순으로 정렬된 직원 배열을 반환 (방어적으로 복사 후 정렬)
export function orderedEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.sort_order - b.sort_order);
}

// 특정 날짜(date: Date)의 야간근무자를 계산
export function assignmentForDate(
  date: Date,
  startDateStr: string | null,
  employees: Employee[],
  overrideMap: Map<string, string> // dateStr -> employee_id
): NightAssignment {
  const dateStr = formatDate(date);
  const weekend = isWeekend(date);
  const ordered = orderedEmployees(employees);

  // 1) 수동 교체분이 있으면 최우선
  const overrideEmpId = overrideMap.get(dateStr);
  if (overrideEmpId) {
    const emp = ordered.find((e) => e.id === overrideEmpId) ?? null;
    return { dateStr, employee: emp, isWeekend: weekend, isOverride: true };
  }

  // 2) 시작일이 없거나, 시작일 이전 날짜면 배정 없음
  if (!startDateStr || ordered.length === 0) {
    return { dateStr, employee: null, isWeekend: weekend, isOverride: false };
  }
  const start = parseDate(startDateStr);
  if (dayDiff(start, date) < 0) {
    return { dateStr, employee: null, isWeekend: weekend, isOverride: false };
  }

  // 3) 규칙으로 자동 계산
  const n = weekend
    ? countWeekendsExclusive(start, date)
    : countWeekdaysExclusive(start, date);
  const idx = ((n % ordered.length) + ordered.length) % ordered.length;
  const emp = ordered[idx] ?? null;

  return { dateStr, employee: emp, isWeekend: weekend, isOverride: false };
}

// override 배열을 빠른 조회용 Map으로 변환
export function buildOverrideMap(overrides: NightOverride[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const o of overrides) map.set(o.date, o.employee_id);
  return map;
}

// 평일조/주말조 각각 사람별 야간근무 횟수 카운트 (공평성 확인용)
// 주어진 날짜 목록(dates)에 대해 누가 몇 번 배정됐는지 센다.
export interface FairnessCount {
  weekday: Record<string, number>; // employee_id -> count
  weekend: Record<string, number>;
}

export function countFairness(
  dates: Date[],
  startDateStr: string | null,
  employees: Employee[],
  overrideMap: Map<string, string>
): FairnessCount {
  const weekday: Record<string, number> = {};
  const weekend: Record<string, number> = {};
  for (const emp of employees) {
    weekday[emp.id] = 0;
    weekend[emp.id] = 0;
  }
  for (const d of dates) {
    const a = assignmentForDate(d, startDateStr, employees, overrideMap);
    if (!a.employee) continue;
    if (a.isWeekend) weekend[a.employee.id] = (weekend[a.employee.id] ?? 0) + 1;
    else weekday[a.employee.id] = (weekday[a.employee.id] ?? 0) + 1;
  }
  return { weekday, weekend };
}
