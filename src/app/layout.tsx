import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BottomNavbar } from '@/components/BottomNavbar';
import { TelegramInit } from '@/components/TelegramInit';
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
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} min-h-screen antialiased flex justify-center`}>
        <Suspense fallback={null}>
          <TelegramInit />
        </Suspense>
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