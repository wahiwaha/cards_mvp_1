import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '인류 진화와 질병 - Notion',
  description: '학술적 노트 작성을 위한 깔끔하고 기능적인 워크스페이스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}