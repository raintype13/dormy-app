'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export const BottomNavbar = () => {
  const pathname = usePathname();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      const user = tg.initDataUnsafe?.user;
      
      if (user) {
        if (user.photo_url) {
          setPhotoUrl(user.photo_url);
        }
        if (user.first_name) {
          setFirstName(user.first_name);
        }
      }
    }
  }, []);

  const isHidden = pathname.startsWith('/listing') || pathname.startsWith('/create');
  if (isHidden) return null;

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="w-full max-w-60 bg-transparent backdrop-blur-sm rounded-full py-2 px-4 pointer-events-auto transition-all">
        <div className="flex items-center justify-between">
          
          {/* Главная — Домик */}
          <Link 
            href="/" 
            className={`p-2 transition-opacity duration-200 ${
              pathname === '/' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <Home className="w-6 h-6 text-(--text-primary) stroke-2" />
          </Link>

          {/* Избранное — Сердце */}
          <Link 
            href="/favorites" 
            className={`p-2 transition-opacity duration-200 ${
              pathname === '/favorites' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <Heart className="w-6 h-6 text-(--text-primary) stroke-2" />
          </Link>

          {/* Профиль — Аватар Telegram */}
          <Link 
            href="/profile" 
            className={`p-1 transition-opacity duration-200 ${
              pathname === '/profile' ? 'opacity-100 ring-2 ring-blue-600 rounded-full' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : firstName ? (
                <span className="text-[10px]">{firstName.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
          </Link>

        </div>
      </nav>
    </div>
  );
};