'use client';

import { User, PlusCircle, Heart, FileText, Settings, Shield, ChevronRight, Globe, Moon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<{ first_name: string; username?: string } | null>(null);

  useEffect(() => {
    // Подтягивание имени из Telegram WebApp API
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      setUser((window as any).Telegram.WebApp.initDataUnsafe.user);
    }

    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) p-4 space-y-6 pb-28">
      {/* Шапка профиля */}
      <div className="pt-2 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-blue-500/20">
          {user?.first_name ? user.first_name[0] : 'U'}
        </div>
        <div>
          <h1 className="text-lg font-black text-(--text-primary)">
            {user?.first_name || 'Студент'}
          </h1>
          <p className="text-xs text-(--text-secondary) font-medium">
            {user?.username ? `@${user.username}` : 'Telegram Пользователь'}
          </p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold">
            Студент СамГУ
          </span>
        </div>
      </div>

      {/* Быстрое действие: Подать объявление */}
      <Link 
        href="/create"
        className="flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          <div>
            <div className="font-bold text-sm">Сдать или продать жильё</div>
            <div className="text-[11px] text-white/80">Бесплатная публикация в Dormy</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/70" />
      </Link>

      {/* Разделы пользователя */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider px-1">
          Моя активность
        </h2>
        <div className="bg-(--card-bg) border border-(--card-border) rounded-2xl overflow-hidden divide-y divide-(--card-border)">
          <Link href="/favorites" className="flex items-center justify-between p-3.5 hover:bg-(--input-bg) transition-colors">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Избранные варианты</span>
            </div>
            <ChevronRight className="w-4 h-4 text-(--text-secondary)" />
          </Link>

          <Link href="/my-listings" className="flex items-center justify-between p-3.5 hover:bg-(--input-bg) transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Мои объявления</span>
            </div>
            <ChevronRight className="w-4 h-4 text-(--text-secondary)" />
          </Link>
        </div>
      </div>

      {/* Настройки приложения */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider px-1">
          Настройки
        </h2>
        <div className="bg-(--card-bg) border border-(--card-border) rounded-2xl overflow-hidden divide-y divide-(--card-border)">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-3.5 hover:bg-(--input-bg) transition-colors text-left cursor-pointer">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Тёмная тема</span>
            </div>
            <span className="text-xs font-bold text-(--text-secondary)">
              {isDark ? 'Вкл' : 'Выкл'}
            </span>
          </button>

          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Язык интерфейса</span>
            </div>
            <span className="text-xs font-bold text-blue-600">Русский (RU)</span>
          </div>
        </div>
      </div>

      {/* О приложении */}
      <div className="text-center pt-4">
        <p className="text-[11px] font-bold text-(--text-secondary)">Dormy v1.0.0 — Student Housing</p>
        <p className="text-[10px] text-(--text-secondary)/70 mt-0.5">Live closer. Study better.</p>
      </div>
    </main>
  );
}