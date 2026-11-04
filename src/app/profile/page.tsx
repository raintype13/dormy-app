'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PlusCircle,
  FileText,
  MapPin,
  Trash2,
  Shield,
  ExternalLink,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';

const DEVELOPER_ID = 1949612933;

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface Listing {
  id: string;
  telegram_id?: string | number | null;
  title: string;
  price: number;
  type?: string;
  location_name?: string | null;
  photos?: string[] | null;
  created_at?: string;
  currency?: string | null;
  rental_period?: string | null;
}

function formatPrice(price: number, currency?: string | null) {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'RUB') return `${formatted} ₽`;

  return `${formatted} сум`;
}

function getRentalLabel(value?: string | null) {
  const labels: Record<string, string> = {
    day: 'в день',
    week: 'в неделю',
    month: 'в месяц',
    year: 'в год',
  };

  return value ? labels[value] || '' : '';
}

function readStringArray(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [hasRestrictions, setHasRestrictions] = useState(false);

  const isDev = Number(telegramUser?.id) === DEVELOPER_ID;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => {
      setToast((current) => current === message ? '' : current);
    }, 3000);
  }, []);

  const refreshRestrictions = useCallback(() => {
    const hidden = readStringArray('dormy_hidden_listings');
    const blocked = readStringArray('dormy_blocked_users');

    setHasRestrictions(hidden.length > 0 || blocked.length > 0);
  }, []);

  const fetchUserListings = useCallback(async (userId: number) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('telegram_id', String(userId))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка загрузки объявлений:', error);
        showToast('Не удалось загрузить объявления.');
        setListings([]);
      } else {
        setListings((data || []) as Listing[]);
      }
    } catch (error) {
      console.error(error);
      showToast('Произошла ошибка при загрузке.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshRestrictions();

    const handleStorageChange = () => refreshRestrictions();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dormy-local-data-changed', handleStorageChange);

    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
      tg.ready?.();

      const user = tg.initDataUnsafe?.user as TelegramUser | undefined;

      if (user?.id) {
        setTelegramUser(user);
        void fetchUserListings(user.id);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dormy-local-data-changed', handleStorageChange);
    };
  }, [fetchUserListings, refreshRestrictions]);

  const handleDelete = async (listing: Listing) => {
    const currentUserId = Number(telegramUser?.id);

    if (!isDev && currentUserId !== Number(listing.telegram_id)) {
      showToast('Вы можете удалять только свои объявления.');
      return;
    }

    if (!window.confirm(`Удалить объявление «${listing.title}»?`)) {
      return;
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listing.id);

    if (error) {
      console.error('Ошибка удаления:', error);
      showToast('Не удалось удалить объявление.');
      return;
    }

    setListings((current) =>
      current.filter((item) => item.id !== listing.id)
    );

    showToast('Объявление удалено.');
  };

  const clearRestrictions = () => {
    localStorage.removeItem('dormy_hidden_listings');
    localStorage.removeItem('dormy_blocked_users');

    window.dispatchEvent(new Event('dormy-local-data-changed'));
    refreshRestrictions();
    showToast('Скрытия и блокировки сброшены.');
  };

  return (
    <main className="min-h-screen space-y-6 bg-(--bg-page) px-4 pb-28 pt-[calc(env(safe-area-inset-top)+20px)] text-(--text-primary)">
      {/* Профиль пользователя */}
      <section className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xl font-black text-white">
          {telegramUser?.photo_url ? (
            <img
              src={telegramUser.photo_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : telegramUser?.first_name ? (
            telegramUser.first_name.charAt(0).toUpperCase()
          ) : (
            <UserIcon className="h-8 w-8" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-black">
              {telegramUser
                ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || 'Пользователь Telegram'
                : 'Профиль'}
            </h1>

            {isDev && (
              <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600">
                <Shield className="h-3 w-3" />
                Dev
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs text-(--text-secondary)">
            {telegramUser?.username
              ? `@${telegramUser.username}`
              : telegramUser?.id
                ? `ID: ${telegramUser.id}`
                : 'Откройте приложение через Telegram'}
          </p>
        </div>
      </section>

      {isDev && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-600">
          <span>Режим разработчика активен</span>
          <Shield className="h-4 w-4" />
        </div>
      )}

      {/* Создание объявления */}
      <Link
        href="/create"
        className="flex items-center justify-between rounded-2xl bg-blue-600 p-4 text-white transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="h-6 w-6" />
          <div>
            <p className="text-sm font-bold">Сдать или продать жильё</p>
            <p className="mt-1 text-[11px] text-white/80">
              Опубликовать объявление
            </p>
          </div>
        </div>
        <ExternalLink className="h-4 w-4" />
      </Link>

      {/* Сброс скрытий и блокировок */}
      {hasRestrictions && (
        <button
          type="button"
          onClick={clearRestrictions}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-(--card-border) bg-(--card-bg) p-3 text-sm font-semibold transition active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Сбросить скрытия и блокировки
        </button>
      )}

      {/* Объявления пользователя */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-(--text-secondary)">
            Мои объявления ({listings.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-(--text-secondary)">
            Загрузка объявлений...
          </div>
        ) : !telegramUser ? (
          <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-5 text-center">
            <p className="text-sm font-semibold">Профиль Telegram недоступен</p>
            <p className="mt-2 text-xs text-(--text-secondary)">
              Откройте Dormy через Telegram, чтобы увидеть свои объявления.
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div className="space-y-2 rounded-2xl border border-(--card-border) bg-(--card-bg) p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-(--text-secondary) opacity-50" />
            <p className="text-sm font-semibold">Пока нет объявлений</p>
            <p className="text-xs text-(--text-secondary)">
              Опубликованные вами объявления появятся здесь.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => {
              const firstPhoto = Array.isArray(item.photos)
                ? item.photos[0]
                : undefined;

              const rentalLabel = item.type === 'Аренда'
                ? getRentalLabel(item.rental_period)
                : '';

              return (
                <article
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-(--card-border) bg-(--card-bg) p-3"
                >
                  <Link
                    href={`/listing/${item.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-(--input-bg) text-xs text-(--text-secondary)">
                      {firstPhoto ? (
                        <img
                          src={firstPhoto}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        'Фото'
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm font-black text-blue-600">
                        {formatPrice(item.price, item.currency)}
                      </p>

                      {rentalLabel && (
                        <p className="text-[10px] text-(--text-secondary)">
                          {rentalLabel}
                        </p>
                      )}

                      <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-(--text-secondary)">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {item.location_name || 'Местоположение не указано'}
                      </p>
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/listing/${item.id}`}
                      aria-label="Открыть объявление"
                      className="rounded-xl bg-(--input-bg) p-2 text-blue-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      aria-label="Удалить объявление"
                      className="rounded-xl bg-(--input-bg) p-2 text-red-500 transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="pt-2 text-center">
        <p className="text-[11px] font-bold text-(--text-secondary)">
          Dormy v1.0.0
        </p>
        <p className="mt-1 text-[10px] text-(--text-secondary)/70">
          Live closer. Study better.
        </p>
      </footer>

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-4 right-4 z-100 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast('')}
            aria-label="Закрыть уведомление"
            className="shrink-0 rounded-lg px-2 py-1 text-white/70"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}