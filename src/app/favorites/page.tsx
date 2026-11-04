'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';

type RentalPeriod = 'day' | 'week' | 'month' | 'year';

function normalizeRentalPeriod(value: unknown): RentalPeriod | null {
  if (
    value === 'day' ||
    value === 'week' ||
    value === 'month' ||
    value === 'year'
  ) {
    return value;
  }

  return null;
}

interface Listing {
  id: string;
  telegram_id: string;
  title: string;
  price: number;
  type: 'Аренда' | 'Продажа';
  location_name: string | null;
  description: string;
  tags: string[] | null;
  photos: string[] | null;
  created_at: string;
  currency?: string | null;
  rental_period?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  author_avatar?: string | null;
}

const FAVORITES_KEY = 'dormy_favorites';
const HIDDEN_KEY = 'dormy_hidden_listings';
const BLOCKED_KEY = 'dormy_blocked_users';

function readIds(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');

    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export default function FavoritesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFavorites, setHasFavorites] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoading(true);

    try {
      const favoriteIds = readIds(FAVORITES_KEY);
      const hiddenIds = readIds(HIDDEN_KEY);
      const blockedIds = readIds(BLOCKED_KEY);

      setHasFavorites(favoriteIds.length > 0);

      if (favoriteIds.length === 0) {
        setListings([]);
        return;
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', favoriteIds);

      if (error) throw error;

      const orderedListings = (data ?? []) as Listing[];

      // Сохраняем порядок добавления в избранное и скрываем
      // объявления, которые пользователь скрыл или заблокировал.
      const ordered = favoriteIds
        .map((id) => orderedListings.find((item) => item.id === id))
        .filter((item): item is Listing => Boolean(item))
        .filter((item) => !hiddenIds.includes(item.id))
        .filter((item) => !blockedIds.includes(String(item.telegram_id)));

      setListings(ordered);
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();

    const handleChange = () => loadFavorites();

    window.addEventListener('storage', handleChange);
    window.addEventListener('dormy-local-data-changed', handleChange);
    window.addEventListener('dormy-listing-deleted', handleChange);

    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('dormy-local-data-changed', handleChange);
      window.removeEventListener('dormy-listing-deleted', handleChange);
    };
  }, [loadFavorites]);

  return (
    <main
      className="min-h-screen space-y-5 bg-(--bg-page) p-4 pb-28 text-(--text-primary)"
      style={{
        paddingTop:
          'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px)) + var(--tg-content-safe-area-inset-top, 0px) + 24px)',
      }}
    >
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
          <Heart className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight">
            Избранное
          </h1>
          <p className="mt-0.5 text-xs text-(--text-secondary)">
            Сохранённые объявления · {listings.length}
          </p>
        </div>

        <Link
          href="/"
          aria-label="На главную"
          className="rounded-xl bg-(--input-bg) p-2.5 text-(--text-primary) transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--input-bg) text-(--text-secondary)">
            <Heart className="h-8 w-8 opacity-50" />
          </div>

          <div>
            <p className="text-sm font-bold">
              {hasFavorites
                ? 'Нет доступных объявлений'
                : 'Список пока пуст'}
            </p>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-(--text-secondary)">
              {hasFavorites
                ? 'Некоторые объявления могли быть удалены, скрыты или принадлежать заблокированным авторам.'
                : 'Нажимай на сердечко в карточке жилья, чтобы сохранить понравившиеся варианты.'}
            </p>
          </div>

          <Link
            href="/"
            className="mt-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition active:scale-95"
          >
            Найти жильё
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              id={item.id}
              telegram_id={item.telegram_id}
              title={item.title}
              price={Number(item.price)}
              type={item.type}
              locationName={item.location_name}
              tags={item.tags ?? []}
              photos={item.photos ?? []}
              createdAt={item.created_at}
              currency={item.currency ?? 'UZS'}
              rentalPeriod={normalizeRentalPeriod(item.rental_period)}
              authorName={item.author_name ?? undefined}
              authorUsername={item.author_username ?? undefined}
              authorAvatar={item.author_avatar ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}