import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "방명록 - guestbook-202402424",
  description: "SDD 방식으로 만든 미니 방명록",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
