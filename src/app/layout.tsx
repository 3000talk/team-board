import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "개포도서관 근무일정",
  description: "개포도서관 근무일정 - 일정표 · 스마트도서관 · 야간 순환근무",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
