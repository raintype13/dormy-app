'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Eye, Send, ShieldCheck, Calendar } from 'lucide-react';

interface Listing {
  id: string;
  telegram_id: string;
  title: string;
  price: number;
  type: 'Аренда' | 'Продажа';
  location_name: string;
  description: string;
  tags: string[];
  photos: string[];
  created_at: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Ошибка загрузки объявления:', error);
      } else {
        setListing(data);
      }
      setLoading(false);
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center text-(--text-secondary) text-xs">
        Загрузка объявления...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center p-4 space-y-3">
        <p className="text-sm font-bold text-(--text-primary)">Объявление не найдено или было удалено</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) pb-28">
      {/* Шапка с кнопкой назад */}
      <div className="sticky top-0 z-30 pt-safe-top pt-4 px-4 pb-3 bg-(--bg-page)/80 backdrop-blur-md flex items-center justify-between border-b border-(--card-border)">
        <button 
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-(--input-bg) text-(--text-primary) flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>
        <span className="text-xs font-bold text-(--text-secondary)">Детали жилья</span>
        <div className="w-9" /> {/* пустой блок для баланса */}
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* Галерея фотографий */}
        <div className="space-y-2">
          <div className="relative h-72 rounded-3xl bg-(--input-bg) overflow-hidden shadow-md">
            {listing.photos && listing.photos.length > 0 ? (
              <img 
                src={listing.photos[activePhotoIndex]} 
                alt={listing.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-(--text-secondary)">
                Нет фотографий
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                {listing.type}
              </span>
            </div>
          </div>

          {/* Миниатюры */}
          {listing.photos && listing.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {listing.photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    activePhotoIndex === idx ? 'border-blue-600 scale-95' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Основная инфа */}
        <div className="bg-(--card-bg) p-5 rounded-3xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-lg font-black text-(--text-primary) leading-snug">
              {listing.title}
            </h1>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-blue-600">${listing.price}</span>
              {listing.type === 'Аренда' && <p className="text-[10px] text-(--text-secondary)">в месяц</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-(--text-secondary) font-medium">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{listing.location_name}</span>
          </div>

          {/* Теги / Удобства */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-(--card-border)">
              {listing.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-(--input-bg) text-(--text-primary) rounded-xl text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Описание */}
        <div className="bg-(--card-bg) p-5 rounded-3xl space-y-2">
          <h2 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">Описание</h2>
          <p className="text-xs text-(--text-primary) leading-relaxed whitespace-pre-wrap">
            {listing.description || 'Автор не добавил подробного описания к этому объявлению.'}
          </p>
        </div>

        {/* Карточка связи с владельцем */}
        <div className="bg-(--card-bg) p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-(--text-primary)">Студент / Владелец</p>
              <p className="text-[10px] text-(--text-secondary)">Проверенный аккаунт Telegram</p>
            </div>
          </div>

          <a 
            href={`https://t.me/${listing.telegram_id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="py-3 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Связаться</span>
          </a>
        </div>

      </div>
    </main>
  );
}