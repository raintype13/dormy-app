'use client';

import { MapPin, Sun, Moon, Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

const DormyLogo = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 8 L88 38 C92 41 92 46 92 50 V80 C92 87 87 92 80 92 H20 C13 92 8 87 8 80 V50 C8 46 8 41 12 38 Z"
        stroke="#1E56EF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="48" r="6" fill="#FF5A5F" />
      <path
        d="M24 76 C 22 62, 34 58, 43 65 C 50 71, 58 76, 68 70"
        stroke="#FF5A5F"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="64" cy="48" r="6" fill="#1E56EF" />
      <path
        d="M76 76 C 78 62, 66 58, 57 65 C 50 71, 42 76, 32 70"
        stroke="#1E56EF"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Header = () => {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'RU' | 'UZ' | 'EN'>('RU');

  useEffect(() => {
    // Светлая тема по умолчанию, проверяем жесткую фиксацию в localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      if (!savedTheme) {
        localStorage.setItem('theme', 'light');
      }
    }

    const savedLang = localStorage.getItem('lang') as 'RU' | 'UZ' | 'EN';
    if (savedLang) setLang(savedLang);
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

  const changeLang = () => {
    const languages: Array<'RU' | 'EN' | 'UZ'> = ['RU', 'EN', 'UZ'];
    const currentIndex = languages.indexOf(lang);
    const newLang = languages[(currentIndex + 1) % languages.length];
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      /*
        Верхний отступ = вырез/островок iPhone (safe-area) + кнопки Telegram в полноэкранном режиме
        (--tg-content-safe-area-inset-top) + небольшой зазор.
        Переменные --tg-* выставляет telegram-web-app.js; без них (обычный браузер) значения = 0.
      */
      className="sticky top-0 z-40 pt-[calc(max(env(safe-area-inset-top,0px),var(--tg-safe-area-inset-top,0px))+var(--tg-content-safe-area-inset-top,0px)+1rem)] pb-6 px-4 space-y-3 backdrop-blur-md bg-(--bg-page)/80 transition-colors duration-200"
      style={{
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)',
      }}
    >
      {/* Верхний ряд */}
      <div className="flex items-center justify-between">
        {/* Логотип */}
        <button onClick={scrollToTop} className="flex items-center gap-2.5 group cursor-pointer text-left">
          <div className="w-10 h-10 rounded-2xl bg-(--input-bg) border border-(--card-border) flex items-center justify-center shadow-sm active:scale-95 transition-transform">
            <DormyLogo className="w-6 h-6" />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight text-(--text-primary)">
              Dormy
            </span>
            <span className="text-[9px] font-bold text-(--text-secondary) tracking-wider uppercase mt-0.5">
              Live closer. Study better.
            </span>
          </div>
        </button>

        {/* Настройки: Город + Флаги языков + Тема */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-(--input-bg) text-(--text-primary) text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-(--text-secondary)" />
            <span>Самарканд</span>
          </div>

          {/* Однокнопочный переключатель языка: RU → EN → UZ */}
          <button
            onClick={changeLang}
            className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-(--input-bg) px-2.5 text-xs font-bold text-(--text-primary) transition-all active:scale-95"
            title="Сменить язык"
            aria-label={`Текущий язык ${lang}. Нажмите, чтобы сменить язык`}
          >
            <span aria-hidden="true">
              {lang === 'RU' ? '🇷🇺' : lang === 'EN' ? '🇬🇧' : '🇺🇿'}
            </span>
            <span>{lang}</span>
          </button>

          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            className="flex items-center p-1 rounded-full bg-(--input-bg) transition-all cursor-pointer"
            title="Переключить тему"
          >
            <div className={`p-1.5 rounded-full transition-all ${!isDark ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className={`p-1.5 rounded-full transition-all ${isDark ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400'}`}>
              <Moon className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Поисковая строка */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
          <input
            type="text"
            placeholder="Ориентир, вуз или район..."
            className="w-full pl-10 pr-4 py-2.5 bg-(--input-bg) text-(--text-primary) rounded-2xl text-xs font-medium placeholder:text-(--text-secondary) focus:outline-none transition-all"
          />
        </div>
        <button className="p-2.5 bg-(--input-bg) text-(--text-primary) rounded-2xl hover:opacity-80 transition-opacity">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};