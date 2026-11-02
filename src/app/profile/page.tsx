'use client';

import { PlusCircle, FileText, MapPin, Trash2, Shield, ExternalLink, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: { user?: TelegramUser };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

interface Listing {
  id: string;
  title: string;
  price: number;
  location_name: string;
  photos?: string[];
  created_at: string;
}

const DEVELOPER_ID = 1949612933;

export default function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = [useState(true)[0], useState(true)[1]]; // Исправлено для корректного хука

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    let user: TelegramUser | null = null;

    if (tg && tg.initDataUnsafe?.user) {
      tg.ready();
      tg.expand();
      user = tg.initDataUnsafe.user;
    } else {
      // Фолбек для разработки в обычном браузере, чтобы не ломалось
      user = {
        id: DEVELOPER_ID,
        first_name: 'Студент',
        username: 'raintype13',
      };
    }

    setTelegramUser(user);

    if (user) {
      supabase
        .from('listings')
        .select('*')
        .eq('telegram_id', String(user.id))
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) console.error('Ошибка загрузки объявлений:', error);
          else setListings(data ?? []);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (!telegramUser) return;
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('telegram_id', String(telegramUser.id));

    if (error) {
      alert('Ошибка при удалении');
      return;
    }
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const isDev = telegramUser?.id === DEVELOPER_ID;
  const fullName = telegramUser
    ? `${telegramUser.first_name} ${telegramUser.last_name ?? ''}`.trim()
    : 'Гость';

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) p-4 space-y-6 pb-28">
      {/* Шапка профиля */}
      <div className="pt-2 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md ring-4 ring-blue-500/20 overflow-hidden shrink-0">
          {telegramUser?.photo_url ? (
            <img src={telegramUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : telegramUser?.first_name ? (
            telegramUser.first_name.charAt(0).toUpperCase()
          ) : (
            <UserIcon className="w-8 h-8" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-black text-(--text-primary)">{fullName}</h1>
            {isDev && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Dev
              </span>
            )}
          </div>

          {telegramUser && (
            <p className="text-xs text-(--text-secondary) font-medium">
              {telegramUser.username ? `@${telegramUser.username}` : `ID: ${telegramUser.id}`}
            </p>
          )}

          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-bold">
            Студент
          </span>
        </div>
      </div>

      {/* Панель разработчика */}
      {isDev && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold flex items-center justify-between">
          <span>Режим разработчика активен</span>
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
            <div className="text-[11px] text-white/85">Публикация от вашего Telegram аккаунта</div>
          </div>
        </div>
      </Link>

      {/* Мои объявления */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
            Мои объявления ({listings.length})
          </h2>
        </div>

        {isLoading ? (
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
                    <p className="text-xs font-black text-blue-600 mt-0.5">
                      ${item.price} <span className="text-[10px] text-(--text-secondary) font-normal">/ мес</span>
                    </p>
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