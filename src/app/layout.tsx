import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNavbar } from '@/components/BottomNavbar';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dormy — Student Housing',
  description: 'Сервис поиска жилья для студентов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} min-h-screen antialiased flex justify-center`}>
        <div className="w-full max-w-md min-h-screen flex flex-col relative">
          <div className="flex-1 pb-24">
            {children}
          </div>
          <Suspense fallback={null}>
            <BottomNavbar />
          </Suspense>
        </div>
      </body>
    </html>
  );
}