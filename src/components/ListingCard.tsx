'use client';

import { Heart, MoreVertical, MapPin, Send, Eye } from 'lucide-react';
import { useState } from 'react';

interface ListingProps {
  title?: string;
  price?: number;
  type?: 'Аренда' | 'Продажа';
  locationName?: string;
  daysAgo?: number;
  viewsCount?: number;
  tags?: string[];
  photos?: string[];
}

export const ListingCard = ({
  title = "2-комн. квартира возле СамГУ",
  price = 180,
  type = "Аренда",
  locationName = "Ул. Университетский бульвар",
  daysAgo = 2,
  viewsCount = 142,
  tags = ["Wi-Fi", "Отопление", "Кондиционер"]
}: ListingProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Если меньше 3 дней — акцентный красный цвет
  const isFresh = daysAgo < 3;

  return (
    <div className="bg-[var(--card-bg)] rounded-3xl overflow-hidden border border-[var(--card-border)] transition-all duration-200 shadow-sm">
      
      {/* 1. Блок изображения */}
      <div className="relative h-52 bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-secondary)] text-xs font-medium">
        [ Картинка из Telegram ]

        {/* Нейтральная плашка типа объявления */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
            {type}
          </span>
        </div>

        {/* Избранное */}
        <button 
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* Дата с акцентным цветом (красная, если < 3 дней) */}
        <div className="absolute bottom-3 right-3">
          <span className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold shadow-sm transition-all ${
            isFresh 
              ? 'bg-red-500 text-white' 
              : 'bg-black/50 text-white/90 border border-white/10'
          }`}>
            {daysAgo === 0 ? 'Сегодня' : `${daysAgo} дня назад`}
          </span>
        </div>
      </div>

      {/* 2. Контентная часть */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug line-clamp-1">
            {title}
          </h3>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-48 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] py-1 z-20 text-xs">
                <button className="w-full text-left px-3 py-2 text-red-500 hover:bg-[var(--input-bg)] transition-colors">
                  Заблокировать
                </button>
                <button className="w-full text-left px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors">
                  Скрыть
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Цена */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[var(--text-primary)] font-black text-xl">${price}</span>
          {type === 'Аренда' && <span className="text-xs font-medium text-[var(--text-secondary)]">/ месяц</span>}
        </div>

        {/* Конкретная локация и Счётчик просмотров */}
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] shrink-0">
            <Eye className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>{viewsCount}</span>
          </div>
        </div>

        {/* Удобства */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {tags.map((tag, i) => (
            <span 
              key={i} 
              className="px-2.5 py-1 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Синяя целевая кнопка */}
        <button className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer">
          <Send className="w-3.5 h-3.5" />
          <span>Написать в Telegram</span>
        </button>
      </div>

    </div>
  );
};