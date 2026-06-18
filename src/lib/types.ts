// 앱 전체에서 쓰는 데이터 타입 정의 (DB 테이블과 1:1 대응)

export type Category = "연가" | "교육" | "비고";

export interface Schedule {
  id: string; // slug, 예: '개포도서관'
  title: string;
  night_start_date: string | null; // 'YYYY-MM-DD'
  smart_start_date: string | null; // 스마트도서관 순환 시작일 'YYYY-MM-DD'
  created_at: string;
}

export interface Employee {
  id: string;
  schedule_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Entry {
  id: string;
  schedule_id: string;
  date: string | null; // 'YYYY-MM-DD' (날짜 기준 일정표)
  employee_id: string;
  category: Category;
  content: string;
  created_at: string;
}

export interface NightOverride {
  id: string;
  schedule_id: string;
  date: string; // 'YYYY-MM-DD'
  employee_id: string;
  created_at: string;
}

// 스마트도서관 수동 교체분 (구조는 night_overrides와 동일)
export interface SmartOverride {
  id: string;
  schedule_id: string;
  date: string; // 'YYYY-MM-DD'
  employee_id: string;
  created_at: string;
}

// 보드 한 개를 그리는 데 필요한 모든 데이터 묶음
export interface BoardData {
  schedule: Schedule;
  employees: Employee[];
  entries: Entry[];
  overrides: NightOverride[];
  smartOverrides: SmartOverride[];
}
