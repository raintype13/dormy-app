'use client';

import { PlusCircle, FileText, MapPin, Trash2, Shield, ExternalLink, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Listing {
  id: string;
  title: string;
  price: number;
  location_name: string;
  photos?: string[];
  created_at: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export default function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Строгий ID разработчика
  const DEVELOPER_ID = 1949612933;

  useEffect(() => {
    const initTelegramUser = () => {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user as TelegramUser;
        setTelegramUser(tgUser);
        fetchUserListings(tgUser.id);
        return true;
      }
      return false;
    };

    // 1. Пробуем получить сразу
    const success = initTelegramUser();

    // 2. Если WebApp еще не прогрузился, ждем готовности скрипта Telegram
    if (!success) {
      const handleReady = () => {
        initTelegramUser();
      };

      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.ready();
        initTelegramUser();
      }

      // Небольшой тайм-аут на случай медленной инициализации SDK
      const timer = setTimeout(() => {
        if (!initTelegramUser()) {
          // Если откроется в обычном браузере PC, только тогда включаем режим отладки
          if (process.env.NODE_ENV === 'development') {
            const devMock: TelegramUser = {
              id: DEVELOPER_ID,
              first_name: 'Dev Account',
              username: 'developer'
            };
            setTelegramUser(devMock);
            fetchUserListings(devMock.id);
          } else {
            setLoading(false);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const fetchUserListings = async (userId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('telegram_id', userId.toString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки объявлений:', error);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;
    
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (!error) {
      setListings(listings.filter(item => item.id !== id));
    } else {
      alert('Ошибка при удалении');
    }
  };

  // Проверка на разработчика: СТРОГО совпадение с ID 1949612933
  const isDev = Number(telegramUser?.id) === DEVELOPER_ID;

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) p-4 space-y-6 pb-28">
      {/* Шапка профиля */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* Аватарка из Telegram или первая буква имени */}
          <div className="w-16 h-16 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-blue-500/20 overflow-hidden shrink-0">
            {telegramUser?.photo_url ? (
              <img 
                src={telegramUser.photo_url} 
                alt={telegramUser.first_name} 
                className="w-full h-full object-cover"
              />
            ) : telegramUser?.first_name ? (
              telegramUser.first_name[0].toUpperCase()
            ) : (
              <UserIcon className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black text-(--text-primary)">
                {telegramUser ? `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}` : 'Загрузка...'}
              </h1>
              {isDev && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Dev
                </span>
              )}
            </div>
            
            <p className="text-xs text-(--text-secondary) font-medium">
              {telegramUser?.username 
                ? `@${telegramUser.username}` 
                : telegramUser?.id 
                  ? `ID: ${telegramUser.id}` 
                  : 'Определение аккаунта...'}
            </p>
            
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold">
              Студент
            </span>
          </div>
        </div>
      </div>

      {/* Панель разработчика — только для твоего ID */}
      {isDev && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold flex items-center justify-between">
          <span>Режим разработчика (доступны права администрирования)</span>
          <Shield className="w-4 h-4 shrink-0" />
        </div>
      )}

      {/* Кнопка создания */}
      <Link 
        href="/create"
        className="flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          <div>
            <div className="font-bold text-sm">Сдать или продать жильё</div>
            <div className="text-[11px] text-white/80">Публикация от вашего аккаунта</div>
          </div>
        </div>
      </Link>

      {/* Мои объявления */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
            Мои объявления ({listings.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-(--text-secondary)">Загрузка объявлений...</div>
        ) : listings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-(--card-bg) border border-(--card-border) text-center space-y-2">
            <FileText className="w-8 h-8 text-(--text-secondary) mx-auto opacity-50" />
            <p className="text-xs font-medium text-(--text-secondary)">У вас пока нет активных объявлений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 rounded-2xl bg-(--card-bg) border border-(--card-border) flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-14 h-14 rounded-xl bg-(--input-bg) shrink-0 flex items-center justify-center text-xs text-(--text-secondary) font-semibold overflow-hidden">
                    {item.photos && item.photos.length > 0 ? (
                      <img src={item.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'Фото'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-(--text-primary) truncate">{item.title}</h3>
                    <p className="text-xs font-black text-blue-600 mt-0.5">${item.price} <span className="text-[10px] text-(--text-secondary) font-normal">/ мес</span></p>
                    <p className="text-[10px] text-(--text-secondary) truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {item.location_name || 'Локация не указана'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link 
                    href={`/listing/${item.id}`}
                    className="p-2 rounded-xl bg-(--input-bg) hover:bg-blue-600/10 text-blue-600 transition-colors"
                    title="Посмотреть"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl bg-(--input-bg) hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <p className="text-[11px] font-bold text-(--text-secondary)">Dormy v1.0.0 — Student Housing</p>
        <p className="text-[10px] text-(--text-secondary)/70 mt-0.5">Live closer. Study better.</p>
      </div>
    </main>
  );
}