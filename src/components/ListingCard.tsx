'use client';

import {
  Heart,
  MoreVertical,
  MapPin,
  Send,
  Eye,
  UserRound,
  EyeOff,
  Ban,
  Trash2,
  X,
} from 'lucide-react';

import {
  useState,
  useEffect,
  useRef,
} from 'react';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ListingProps {
  id: string;
  telegram_id?: string;
  title?: string;
  price?: number;
  type?: 'Аренда' | 'Продажа';
  locationName?: string | null;
  createdAt?: string;
  tags?: string[];
  photos?: string[];
  currency?: 'UZS' | 'USD' | 'RUB' | string;
  rentalPeriod?: 'day' | 'week' | 'month' | 'year' | null;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
}

const FAVORITES_KEY = 'dormy_favorites';
const HIDDEN_KEY = 'dormy_hidden_listings';
const BLOCKED_KEY = 'dormy_blocked_users';

function readStringArray(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');

    if (!Array.isArray(value)) return [];

    return value.map(String);
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]) {
  localStorage.setItem(key, JSON.stringify([...new Set(values)]));
}

function dispatchLocalChange() {
  window.dispatchEvent(new Event('dormy-local-data-changed'));
}

function formatPrice(price: number, currency: string) {
  const validCurrency = ['UZS', 'USD', 'RUB'].includes(currency)
    ? currency
    : 'UZS';

  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(price) + ' ' + validCurrency;
}

function getPeriodLabel(period?: string | null) {
  switch (period) {
    case 'day':
      return '/ день';
    case 'week':
      return '/ нед.';
    case 'year':
      return '/ год';
    case 'month':
    default:
      return '/ мес.';
  }
}

function getTimeAgo(dateString?: string) {
  if (!dateString) return 'Недавно';

  const timestamp = new Date(dateString).getTime();

  if (!Number.isFinite(timestamp)) return 'Недавно';

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;

  return `${Math.floor(days / 30)} мес. назад`;
}

export const ListingCard = ({
  id,
  telegram_id = '',
  title = 'Объявление без названия',
  price = 0,
  type = 'Аренда',
  locationName,
  createdAt,
  tags = [],
  photos = [],
  currency = 'UZS',
  rentalPeriod = 'month',
  authorName,
  authorUsername,
  authorAvatar,
}: ListingProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DEVELOPER_ID = '1949612933';

  useEffect(() => {
    const tgUser = (
      window as Window & {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: {
              user?: { id: number };
            };
          };
        };
      }
    ).Telegram?.WebApp?.initDataUnsafe?.user;

    if (tgUser?.id) {
      setCurrentUserId(String(tgUser.id));
    }

    setIsFavorite(readStringArray(FAVORITES_KEY).includes(id));
  }, [id]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToast('');
    }, 3000);

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  const showNotification = (message: string, error = false) => {
    setToast(message);
    setToastError(error);
  };

  const toggleFavorite = () => {
    const favorites = readStringArray(FAVORITES_KEY);

    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];

    writeStringArray(FAVORITES_KEY, next);
    setIsFavorite(next.includes(id));
    dispatchLocalChange();

    showNotification(
      next.includes(id)
        ? 'Добавлено в избранное'
        : 'Удалено из избранного'
    );
  };

  const hideListing = () => {
    const hidden = readStringArray(HIDDEN_KEY);

    writeStringArray(HIDDEN_KEY, [...hidden, id]);
    setShowMenu(false);
    dispatchLocalChange();

    showNotification('Объявление скрыто');
  };

  const blockAuthor = () => {
    if (!telegram_id) {
      showNotification('Не удалось определить автора объявления', true);
      return;
    }

    const blocked = readStringArray(BLOCKED_KEY);

    writeStringArray(BLOCKED_KEY, [...blocked, telegram_id]);
    setShowMenu(false);
    dispatchLocalChange();

    showNotification('Объявления этого автора скрыты');
  };

  const deleteListing = async () => {
    const isOwner = currentUserId !== '' && currentUserId === telegram_id;
    const isDeveloper = currentUserId === DEVELOPER_ID;

    if (!isOwner && !isDeveloper) {
      showNotification('Нет прав для удаления этого объявления', true);
      return;
    }

    const confirmed = window.confirm(
      'Удалить это объявление? Это действие нельзя отменить.'
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Убираем удалённое объявление из избранного и скрытых.
      writeStringArray(
        FAVORITES_KEY,
        readStringArray(FAVORITES_KEY).filter((item) => item !== id)
      );

      writeStringArray(
        HIDDEN_KEY,
        readStringArray(HIDDEN_KEY).filter((item) => item !== id)
      );

      setShowMenu(false);
      dispatchLocalChange();
      window.dispatchEvent(
        new CustomEvent('dormy-listing-deleted', {
          detail: { id },
        })
      );

      showNotification('Объявление удалено');
    } catch (error) {
      console.error('Ошибка удаления объявления:', error);
      showNotification(
        'Не удалось удалить объявление. Проверьте права Supabase.',
        true
      );
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = currentUserId !== '' && currentUserId === telegram_id;
  const isDeveloper = currentUserId === DEVELOPER_ID;
  const canDelete = isOwner || isDeveloper;

  const validCurrency = ['UZS', 'USD', 'RUB'].includes(currency)
    ? currency
    : 'UZS';

  const profileUrl = authorUsername
    ? `https://t.me/${authorUsername.replace(/^@/, '')}`
    : telegram_id
      ? `tg://user?id=${telegram_id}`
      : 'https://t.me/';

  const displayName =
    authorName?.trim() ||
    (authorUsername ? `@${authorUsername}` : 'Пользователь Telegram');

  const isFresh = createdAt
    ? Date.now() - new Date(createdAt).getTime() < 3 * 86_400_000
    : false;

  return (
    <article className="overflow-hidden rounded-3xl border border-(--card-border) bg-(--card-bg) transition-all duration-200">
      {/* Фото */}
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-(--input-bg)">
        <Link
          href={`/listing/${encodeURIComponent(id)}`}
          className="absolute inset-0 z-0"
          aria-label={`Открыть объявление: ${title}`}
        >
          {photos.length > 0 ? (
            <img
              src={photos[0]}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-(--text-secondary)">
              Нет фотографий
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            {type}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/45 p-2.5 text-white backdrop-blur-md transition active:scale-90"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>

        {createdAt && (
          <div className="pointer-events-none absolute bottom-3 right-3 z-10">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md ${
                isFresh
                  ? 'bg-red-500 text-white'
                  : 'border border-white/10 bg-black/55 text-white'
              }`}
            >
              {getTimeAgo(createdAt)}
            </span>
          </div>
        )}
      </div>

      {/* Контент карточки */}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/listing/${encodeURIComponent(id)}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-(--text-primary) transition-colors hover:text-blue-600">
              {title}
            </h3>
          </Link>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((value) => !value)}
              aria-label="Меню объявления"
              aria-expanded={showMenu}
              className="rounded-xl p-1.5 text-(--text-secondary) transition hover:bg-(--input-bg) hover:text-(--text-primary) active:scale-90"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-2xl border border-(--card-border) bg-(--card-bg) py-1 shadow-xl">
                <button
                  type="button"
                  onClick={hideListing}
                  className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-xs font-medium text-(--text-primary) transition hover:bg-(--input-bg)"
                >
                  <EyeOff className="h-4 w-4 text-(--text-secondary)" />
                  Скрыть объявление
                </button>

                {telegram_id && (
                  <button
                    type="button"
                    onClick={blockAuthor}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-xs font-medium text-red-500 transition hover:bg-(--input-bg)"
                  >
                    <Ban className="h-4 w-4" />
                    Скрыть объявления автора
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={deleteListing}
                    disabled={deleting}
                    className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-xs font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Удаление...' : 'Удалить объявление'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Цена */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xl font-black text-blue-600">
            {formatPrice(Number(price) || 0, validCurrency)}
          </span>

          {type === 'Аренда' && (
            <span className="text-xs font-medium text-(--text-secondary)">
              {getPeriodLabel(rentalPeriod)}
            </span>
          )}
        </div>

        {/* Локация */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-(--text-secondary)">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span className="truncate">
            {locationName?.trim() || 'Локация не указана'}
          </span>
        </div>

        {/* Удобства */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 8).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-lg bg-(--input-bg) px-2.5 py-1 text-[11px] font-medium text-(--text-primary)"
              >
                {tag}
              </span>
            ))}

            {tags.length > 8 && (
              <span className="rounded-lg bg-(--input-bg) px-2.5 py-1 text-[11px] text-(--text-secondary)">
                +{tags.length - 8}
              </span>
            )}
          </div>
        )}

        {/* Автор и связь */}
        <div className="flex items-center justify-between gap-2 border-t border-(--card-border) pt-3">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-75"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600/10 text-blue-600">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-(--text-primary)">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-(--text-secondary)">
                {authorUsername
                  ? `@${authorUsername.replace(/^@/, '')}`
                  : `Telegram ID: ${telegram_id || 'не указан'}`}
              </p>
            </div>
          </a>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-bold text-white transition hover:bg-blue-700 active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
            Связаться
          </a>
        </div>
      </div>

      {/* Неблокирующее уведомление */}
      {toast && (
        <div
          role="status"
          className={`fixed left-4 right-4 top-5 z-100 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
            toastError ? 'bg-red-600' : 'bg-zinc-900'
          }`}
        >
          <span>{toast}</span>

          <button
            type="button"
            onClick={() => setToast('')}
            aria-label="Закрыть уведомление"
            className="rounded-full p-1 transition active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </article>
  );
};