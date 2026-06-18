// 날짜 관련 순수 함수 모음 (시간대 문제를 피하려고 '로컬 자정' 기준으로 다룸)

// 'YYYY-MM-DD' 문자열 -> Date(로컬 자정)
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Date -> 'YYYY-MM-DD' 문자열
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 주말(토/일) 여부. getDay(): 0=일, 6=토
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// 하루(ms)
const DAY_MS = 24 * 60 * 60 * 1000;

// 두 날짜 사이의 "일 수" (a -> b). 같은 날이면 0.
export function dayDiff(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((b0 - a0) / DAY_MS);
}

// [start, end) 구간(끝 미포함)에 들어있는 "평일(월~금)" 개수
export function countWeekdaysExclusive(start: Date, end: Date): number {
  const total = dayDiff(start, end);
  if (total <= 0) return 0;
  const fullWeeks = Math.floor(total / 7);
  let count = fullWeeks * 5; // 한 주에는 평일이 5일
  const remainder = total % 7;
  let dow = start.getDay();
  for (let i = 0; i < remainder; i++) {
    if (dow !== 0 && dow !== 6) count++;
    dow = (dow + 1) % 7;
  }
  return count;
}

// [start, end) 구간(끝 미포함)에 들어있는 "주말(토/일)" 개수
export function countWeekendsExclusive(start: Date, end: Date): number {
  const total = dayDiff(start, end);
  if (total <= 0) return 0;
  return total - countWeekdaysExclusive(start, end);
}

// 어떤 달(year, month0: 0=1월)의 달력 그리드(월요일 시작 7열)에 들어갈
// 42칸(또는 35칸) 날짜 배열을 만든다. 앞뒤로 이웃 달 날짜가 채워짐.
export function buildMonthGrid(year: number, month0: number): Date[] {
  const first = new Date(year, month0, 1);
  // 월요일 시작으로 맞추기: getDay() 0=일..6=토 -> 월=0이 되도록 변환
  const firstDow = (first.getDay() + 6) % 7; // 월:0, 화:1, ... 일:6
  const gridStart = new Date(year, month0, 1 - firstDow);

  const cells: Date[] = [];
  // 6주(42칸)면 어떤 달이든 안전하게 다 담긴다
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return cells;
}
