import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "팀 관리 - 일정표 & 야간 순환근무",
  description: "실시간 공유 팀 관리 웹앱",
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
