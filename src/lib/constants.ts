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

// 일정표 카테고리(열) 순서와 헤더 톤 (같은 그린 팔레트 안에서 명도만 다르게)
export const CATEGORIES: {
  key: Category;
  label: string;
  headerBg: string;
  headerText: string;
}[] = [
  { key: "교육", label: "교육", headerBg: "#00704A", headerText: "#FFFFFF" },
  { key: "행사", label: "행사", headerBg: "#3E7C59", headerText: "#FFFFFF" },
  { key: "연가", label: "연가", headerBg: "#6B8E6E", headerText: "#FFFFFF" },
];
