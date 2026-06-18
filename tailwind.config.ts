import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 스타벅스 무드 그린 팔레트
        house: "#00704A", // 메인 그린 (버튼/헤더/강조)
        forest: "#1E3932", // 딥 그린 (제목/본문 텍스트)
        mint: "#D4E9E2", // 민트 틴트 (주말 칸/칩 배경)
        cream: "#F7F5EF", // 크림 배경 (페이지/카드)
        line: "#E2DECF", // 보조 라인 (옅은 테두리)
      },
      borderRadius: {
        card: "16px",
        cell: "10px",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
