'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart } from 'lucide-react';

export const BottomNavbar = () => {
  const pathname = usePathname();

  const isHidden = pathname.startsWith('/listing') || pathname.startsWith('/create');
  if (isHidden) return null;

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      {/* Полностью прозрачный островок, минимальный блюр, никаких обводок */}
      <nav className="w-full max-w-[240px] bg-transparent backdrop-blur-sm rounded-full py-2 px-4 pointer-events-auto transition-all">
        <div className="flex items-center justify-between">
          
          {/* Главная — Домик */}
          <Link 
            href="/" 
            className={`p-2 transition-opacity duration-200 ${
              pathname === '/' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <Home className="w-6 h-6 text-[var(--text-primary)] stroke-[2]" />
          </Link>

          {/* Избранное — Сердце */}
          <Link 
            href="/favorites" 
            className={`p-2 transition-opacity duration-200 ${
              pathname === '/favorites' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <Heart className="w-6 h-6 text-[var(--text-primary)] stroke-[2]" />
          </Link>

          {/* Профиль — Круглый аватар Telegram */}
          <Link 
            href="/profile" 
            className={`p-1 transition-opacity duration-200 ${
              pathname === '/profile' ? 'opacity-100 ring-2 ring-blue-600 rounded-full' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
              {/* Заглушка аватара пользователя Telegram */}
              <span className="text-[10px]">TG</span>
            </div>
          </Link>

        </div>
      </nav>
    </div>
  );
};