import BoardClient from "@/components/BoardClient";

// 동적 경로 /board/[slug] 페이지.
// Next.js가 URL의 한글/인코딩을 자동으로 풀어서 params.slug에 넣어줍니다.
export default function BoardPage({ params }: { params: { slug: string } }) {
  // 혹시 이중 인코딩된 경우를 대비해 안전하게 한 번 더 디코딩 시도
  let boardId = params.slug;
  try {
    boardId = decodeURIComponent(params.slug);
  } catch {
    // 디코딩 실패 시 원본 사용
  }
  return <BoardClient boardId={boardId} />;
}
