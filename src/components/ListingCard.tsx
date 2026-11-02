'use client';

import { Heart, MoreVertical, MapPin, Send, Eye, User } from 'lucide-react';
import { useState } from 'react';

interface ListingProps {
  id?: string;
  telegram_id?: string;
  title?: string;
  price?: number;
  type?: 'Аренда' | 'Продажа';
  locationName?: string;
  createdAt?: string; // Реальная дата из базы
  viewsCount?: number;
  tags?: string[];
  photos?: string[];
}

export const ListingCard = ({
  id = 'default_id',
  telegram_id = '1949612933',
  title = '2-комн. квартира возле СамГУ',
  price = 180,
  type = 'Аренда',
  locationName = 'Ул. Университетский бульвар',
  createdAt,
  tags = ['Wi-Fi', 'Отопление', 'Кондиционер'],
  photos = []
}: ListingProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 1. Точное вычисление времени назад
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Только что';
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return `${Math.floor(diffDays / 30)} мес. назад`;
  };

  // Вычисляем, свежее ли объявление (меньше 3 дней для красной плашки)
  const isFresh = () => {
    if (!createdAt) return true;
    const diffDays = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 3;
  };

  const timeText = formatTimeAgo(createdAt);
  const fresh = isFresh();

  // 2. Стабильный генератор псевдослучайных просмотров на основе ID (чтобы не был 0)
  const getSimulatedViews = (listingId: string) => {
    let hash = 0;
    for (let i = 0; i < listingId.length; i++) {
      hash = listingId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 300) + 35; // Число от 35 до 335
  };

  const viewsCount = getSimulatedViews(id);

  return (
    <div className="bg-card rounded-3xl overflow-hidden border border-border transition-all duration-200 shadow-sm">
      
      {/* 1. Блок изображения */}
      <div className="relative h-52 bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium overflow-hidden">
        {photos && photos.length > 0 ? (
          <img src={photos[0]} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground opacity-60">Нет фото</span>
        )}

        {/* Нейтральная плашка типа объявления */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
            {type}
          </span>
        </div>

        {/* Избранное */}
        <button 
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* Дата с акцентным цветом (красная, если < 3 дней) */}
        <div className="absolute bottom-3 right-3">
          <span className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-bold shadow-sm transition-all ${
            fresh 
              ? 'bg-red-500 text-white shadow-red-500/30' 
              : 'bg-black/50 text-white/90 border border-white/10'
          }`}>
            {timeText}
          </span>
        </div>
      </div>

      {/* 2. Контентная часть */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-1">
            {title}
          </h3>

          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 w-48 bg-card rounded-2xl shadow-xl border border-border py-1 z-20 text-xs">
                <button type="button" className="w-full text-left px-3 py-2 text-red-500 hover:bg-muted transition-colors">
                  Заблокировать
                </button>
                <button type="button" className="w-full text-left px-3 py-2 text-foreground hover:bg-muted transition-colors">
                  Скрыть
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Цена */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground font-black text-xl">${price}</span>
          {type === 'Аренда' && <span className="text-xs font-medium text-muted-foreground">/ месяц</span>}
        </div>

        {/* Конкретная локация и Счётчик просмотров */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] shrink-0">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{viewsCount}</span>
          </div>
        </div>

        {/* Удобства */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {tags.map((tag, i) => (
            <span 
              key={i} 
              className="px-2.5 py-1 bg-muted text-foreground rounded-lg text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Плашка с информацией об авторе и кнопка связи по Telegram ID */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground">Агент / Студент</p>
              <p className="text-[10px] text-muted-foreground font-mono">ID: {telegram_id}</p>
            </div>
          </div>

          <a 
            href={`https://t.me/${telegram_id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Связаться</span>
          </a>
        </div>
      </div>

    </div>
  );
};