'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Send,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

type RentalPeriod = 'day' | 'week' | 'month' | 'year';

interface Listing {
  id: string;
  telegram_id?: string | number | null;
  title: string;
  price: number;
  type: string;
  location_name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  photos?: string[] | null;
  created_at?: string | null;
  currency?: string | null;
  rental_period?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  author_avatar?: string | null;
}

const currencyLabels: Record<string, string> = {
  UZS: 'сум',
  USD: '$',
  RUB: '₽',
};

const periodLabels: Record<RentalPeriod, string> = {
  day: 'в день',
  week: 'в неделю',
  month: 'в месяц',
  year: 'в год',
};

function normalizeRentalPeriod(value?: string | null): RentalPeriod | null {
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

function formatPrice(price: number, currency?: string | null) {
  const code = currency || 'UZS';

  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

  if (code === 'USD') return `$${formatted}`;
  if (code === 'RUB') return `${formatted} ₽`;

  return `${formatted} сум`;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchListing() {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        console.error('Ошибка загрузки объявления:', fetchError);
        setError('Не удалось загрузить объявление.');
        setListing(null);
      } else if (!data) {
        setError('Объявление не найдено или было удалено.');
        setListing(null);
      } else {
        setListing(data as Listing);
      }

      setLoading(false);
    }

    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-(--bg-page) text-(--text-secondary) flex items-center justify-center px-5">
        <p className="text-sm">Загрузка объявления...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-(--bg-page) text-(--text-primary) flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold">
          {error || 'Объявление не найдено.'}
        </p>

        <a
          href="/"
          className="mt-4 rounded-xl bg-(--input-bg) px-5 py-3 text-sm font-semibold"
        >
          На главную
        </a>
      </main>
    );
  }

  const photos = Array.isArray(listing.photos)
    ? listing.photos.filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)
    : [];

  const tags = Array.isArray(listing.tags) ? listing.tags : [];
  const rentalPeriod = normalizeRentalPeriod(listing.rental_period);
  const currency = listing.currency || 'UZS';

  const username = listing.author_username?.replace(/^@/, '');
  const telegramId = listing.telegram_id;

  const contactUrl = username
    ? `https://t.me/${username}`
    : telegramId
      ? `tg://user?id=${telegramId}`
      : null;

  const authorName = listing.author_name || (
    username ? `@${username}` : 'Владелец жилья'
  );

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) pb-28">
      <div className="mx-auto max-w-lg space-y-5 px-4 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-(--text-secondary)">
            Объявление
          </span>

          <span className="rounded-full bg-(--input-bg) px-3 py-1.5 text-xs font-semibold">
            {listing.type || 'Жильё'}
          </span>
        </div>

        {/* Фотографии */}
        <section className="space-y-2">
          <div className="relative h-72 overflow-hidden rounded-3xl bg-(--input-bg)">
            {photos.length > 0 ? (
              <img
                src={photos[activePhotoIndex] || photos[0]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-(--text-secondary)">
                <ImageIcon className="h-9 w-9 opacity-50" />
                <span className="text-xs">Фотографии не добавлены</span>
              </div>
            )}

            {photos.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
                {activePhotoIndex + 1} / {photos.length}
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  aria-label={`Фото ${index + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activePhotoIndex === index
                      ? 'border-blue-600'
                      : 'border-transparent opacity-65'
                  }`}
                >
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Основная информация */}
        <section className="space-y-4 rounded-3xl border border-(--card-border) bg-(--card-bg) p-5">
          <div>
            <h1 className="text-xl font-black leading-snug">
              {listing.title}
            </h1>

            <p className="mt-3 text-2xl font-black text-blue-600">
              {formatPrice(listing.price, currency)}
              {listing.type === 'Аренда' && rentalPeriod && (
                <span className="ml-1 text-xs font-medium text-(--text-secondary)">
                  {periodLabels[rentalPeriod]}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-start gap-2 text-sm text-(--text-secondary)">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>{listing.location_name || 'Местоположение не указано'}</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-(--card-border) pt-4">
              {tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-xl bg-(--input-bg) px-3 py-2 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Описание */}
        <section className="space-y-3 rounded-3xl border border-(--card-border) bg-(--card-bg) p-5">
          <h2 className="text-sm font-bold">Описание</h2>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-(--text-secondary)">
            {listing.description?.trim() ||
              'Автор не добавил описание к этому объявлению.'}
          </p>
        </section>

        {/* Владелец */}
        <section className="flex items-center justify-between gap-3 rounded-3xl border border-(--card-border) bg-(--card-bg) p-4">
          <div className="flex min-w-0 items-center gap-3">
            {listing.author_avatar ? (
              <img
                src={listing.author_avatar}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{authorName}</p>

              <p className="mt-1 text-xs text-(--text-secondary)">
                Владелец объявления
              </p>
            </div>
          </div>

          {contactUrl ? (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white transition active:scale-95"
            >
              <Send className="h-4 w-4" />
              Связаться
            </a>
          ) : (
            <span className="max-w-28 text-right text-xs text-(--text-secondary)">
              Контакты не указаны
            </span>
          )}
        </section>

        <p className="pb-4 text-center text-[10px] text-(--text-secondary)">
          ID объявления: {listing.id}
        </p>
      </div>
    </main>
  );
}