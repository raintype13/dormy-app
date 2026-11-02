'use client';

import { useState, useEffect } from 'react';
import { Home, PlusCircle, Heart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const BottomNavbar = () => {
  const pathname = usePathname();
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Профиль');

  useEffect(() => {
    // Безопасное чтение данных пользователя из Telegram WebApp (с фолбеком на dev-режим)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      const tgUser = tg.initDataUnsafe?.user;
      
      if (tgUser) {
        if (tgUser.photo_url) setUserPhoto(tgUser.photo_url);
        if (tgUser.first_name) setUserName(tgUser.first_name);
      } else {
        // Dev-режим для тестирования с фиксированным ID (1949612933)
        setUserName('Студент (Dev)');
      }
    }
  }, []);

  const navItems = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/create', label: 'Разместить', icon: PlusCircle },
    { href: '/favorites', label: 'Избранное', icon: Heart },
    { 
      href: '/profile', 
      label: userName, 
      icon: userPhoto ? () => <img src={userPhoto} alt="Avatar" className="w-5 h-5 rounded-full object-cover" /> : User 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-(--bg-page)/80 backdrop-blur-md border-t border-(--card-border)">
      <div className="max-w-md mx-auto flex items-center justify-around bg-(--card-bg) p-2 rounded-2xl shadow-lg border border-(--card-border)">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-blue-600 bg-blue-500/10 font-bold' : 'text-(--text-secondary) hover:text-(--text-primary)'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] truncate max-w-17.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};