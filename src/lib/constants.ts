import type { Category } from "./types";

// 이번 팀표의 기본 공유 ID (slug)
export const DEFAULT_BOARD_ID = "개포도서관";

// 초기 팀원 6명. 색상은 스타벅스 그린 무드에 어울리는 차분한 톤.
// sort_order 순서가 곧 야간 순환근무 순서입니다.
export const INITIAL_EMPLOYEES: { name: string; color: string }[] = [
  { name: "박지혜", color: "#00704A" }, // 하우스 그린
  { name: "김송연", color: "#3E7C59" }, // 세이지 그린
  { name: "윤송주", color: "#6B8E6E" }, // 모스 그린
  { name: "서재은", color: "#1E3932" }, // 포레스트
  { name: "홍수진", color: "#8A9A5B" }, // 올리브
  { name: "이수현", color: "#4F7A6F" }, // 파인 틸
];

// ── 스마트도서관(탭3) 순환 설정 ──
// 매주 화(2), 금(5)에만 배정. (getDay(): 0=일 … 2=화 … 5=금)
export const SMART_LIBRARY_WEEKDAYS = [2, 5];

// 순환에 참여하는 4명을 sort_order 기준으로 지정 (이름이 바뀌어도 사람은 고정).
// 요청 순서: 서재은 → 윤송주 → 홍수진 → 이수현
//   sort_order 매핑: 0 박지혜 / 1 김송연 / 2 윤송주 / 3 서재은 / 4 홍수진 / 5 이수현
export const SMART_LIBRARY_SORT_ORDERS = [3, 2, 4, 5];

// 수동으로 교체된 칸을 구분해서 보여줄 색 (직원 색과 다른 차분한 클레이 톤)
export const SMART_OVERRIDE_COLOR = "#B5774A";

// 매월 마지막 주 화요일 = '촬영' 날 (노란색으로 표시)
export const FILMING_LABEL = "촬영";
export const FILMING_COLOR = "#E0B100"; // 차분한 머스터드 옐로

// 일정표 카테고리(열) 순서와 헤더 톤 (같은 그린 팔레트 안에서 명도만 다르게)
export const CATEGORIES: {
  key: Category;
  label: string;
  headerBg: string;
  headerText: string;
}[] = [
  { key: "연가", label: "연가", headerBg: "#00704A", headerText: "#FFFFFF" },
  { key: "교육", label: "교육", headerBg: "#3E7C59", headerText: "#FFFFFF" },
  { key: "비고", label: "비고", headerBg: "#6B8E6E", headerText: "#FFFFFF" },
];
