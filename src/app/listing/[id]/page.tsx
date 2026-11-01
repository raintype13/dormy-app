'use client';

import { ArrowLeft, Heart, Share2, MapPin, Eye, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';

function ListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  // Имитация загрузки данных по ID
  const listingId = params?.id || '#WI083';

  const handleShare = () => {
    const botUsername = 'DormyHousingBot';
    const shareUrl = `https://t.me/${botUsername}/app?startapp=listing_${listingId}`;
    const text = `🏠 2-комн. квартира возле СамГУ\n💰 $180 / месяц\n\nСмотри подробнее в Dormy:`;

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
      (window as any).Telegram.WebApp.openTelegramLink(telegramShareUrl);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Ссылка на объявление скопирована!');
    }
  };

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) pb-28">
      {/* Верхняя плавающая панель навигации */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-linear-to-b from-black/60 to-transparent">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all cursor-pointer"
            title="Поделиться"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        </div>
      </div>

      {/* Галерея изображений (Плейсхолдер) */}
      <div className="relative h-80 bg-(--input-bg) flex items-center justify-center text-(--text-secondary) font-semibold text-sm">
        [ Слайдер фотографий из Telegram ]
        
        {/* Метка свежести объявления */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-md">
            Свежее (2 дня назад)
          </span>
        </div>
      </div>

      {/* Контентная часть */}
      <div className="p-5 space-y-6">
        {/* Заголовок и ID */}
        <div>
          <div className="flex items-center justify-between text-xs text-(--text-secondary) mb-1 font-mono">
            <span>ID: {listingId}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              142 просмотра
            </span>
          </div>
          <h1 className="text-xl font-black text-(--text-primary) leading-snug">
            2-комн. квартира возле СамГУ
          </h1>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-(--text-secondary) font-medium">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Ул. Университетский бульвар, Самарканд</span>
          </div>
        </div>

        {/* Цена и формат */}
        <div className="p-4 rounded-2xl bg-(--input-bg) flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-(--text-primary)">$180</span>
            <span className="text-xs text-(--text-secondary) font-medium"> / месяц</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">
            Аренда
          </span>
        </div>

        {/* Удобства */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
            Удобства и сервисы
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Wi-Fi', 'Отопление', 'Кондиционер', 'Стиральная машина', 'Холодильник', 'Балкон'].map((item, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 rounded-xl bg-(--input-bg) text-xs font-semibold text-(--text-primary) flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
            Описание
          </h3>
          <p className="text-sm leading-relaxed text-(--text-primary) opacity-90 font-normal">
            Сдаётся светлая и чистая двухкомнатная квартира в 5 минутах ходьбы от главного корпуса СамГУ.
            Идеально подходит для 2-3 студентов. Есть всё необходимое для комфортной учебы и проживания. 
            Тихий двор, рядом супермаркеты, аптеки и остановка общественного транспорта.
          </p>
        </div>

        {/* Профиль владельца */}
        <div className="p-4 rounded-2xl bg-(--card-bg) border border-(--card-border) flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              TG
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-bold text-(--text-primary)">
                <span>Собственник</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-(--text-secondary)">В Dormy с 2026 г.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Закрепленная кнопка связи */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-(--bg-page)/80 backdrop-blur-md border-t border-(--card-border) z-40 flex justify-center">
        <div className="w-full max-w-md">
          <button className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer">
            <Send className="w-4 h-4" />
            <span>Написать собственнику в Telegram</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-(--bg-page) flex items-center justify-center text-sm font-medium">Загрузка объявления...</div>}>
      <ListingDetailContent />
    </Suspense>
  );
}