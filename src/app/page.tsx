'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';

import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { supabase } from '@/lib/supabase';

import {
  Loader2,
  ArrowDown,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

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
  views?: number;
}

const PAGE_SIZE = 8;
const PULL_THRESHOLD = 70;
const PULL_MAX = 110;
const MIN_SPINNER_MS = 500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readIds(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');

    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

/** Простой нечёткий поиск: учитывает совпадения и небольшие опечатки. */
function levenshtein(a: string, b: string): number {
  const left = a.toLowerCase();
  const right = b.toLowerCase();

  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);

  for (let i = 1; i <= left.length; i++) {
    const current = [i];

    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
    }

    previous = current;
  }

  return previous[right.length];
}

function matchesFuzzy(text: string, query: string) {
  const normalizedText = text.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return true;
  if (normalizedText.includes(normalizedQuery)) return true;

  const words = normalizedText.split(/[\s,.;:/()[\]{}_-]+/).filter(Boolean);

  return words.some((word) => {
    if (word.includes(normalizedQuery)) return true;

    if (
      normalizedQuery.length >= 4 &&
      word.length >= 4 &&
      levenshtein(word, normalizedQuery) <=
        (normalizedQuery.length >= 8 ? 2 : 1)
    ) {
      return true;
    }

    return false;
  });
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'Все' | 'Аренда' | 'Продажа'>('Все');

  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const pageRef = useRef(-1);
  const loadingRef = useRef(false);
  const refreshingRef = useRef(false);
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadRestrictions = useCallback(() => {
    setHiddenIds(readIds('dormy_hidden_listings'));
    setBlockedIds(readIds('dormy_blocked_users'));
  }, []);

  const fetchPage = useCallback(async (pageIndex: number) => {
    const from = pageIndex * PAGE_SIZE;

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    return (data ?? []) as Listing[];
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || refreshingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchPage(nextPage);

      pageRef.current = nextPage;

      setListings((previous) => {
        if (nextPage === 0) return data;

        const existing = new Set(previous.map((item) => item.id));
        return [...previous, ...data.filter((item) => !existing.has(item.id))];
      });

      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchPage, hasMore]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current || loadingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const [data] = await Promise.all([
        fetchPage(0),
        wait(MIN_SPINNER_MS),
      ]);

      pageRef.current = 0;
      setListings(data);
      setHasMore(data.length === PAGE_SIZE);
      loadRestrictions();
    } catch (error) {
      console.error('Ошибка обновления ленты:', error);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
    }
  }, [fetchPage, loadRestrictions]);

  useEffect(() => {
    loadRestrictions();

    const onLocalChange = () => loadRestrictions();

    const onListingDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      const deletedId = customEvent.detail?.id;

      if (deletedId) {
        setListings((previous) => previous.filter((item) => item.id !== deletedId));
      }
    };

    window.addEventListener('storage', onLocalChange);
    window.addEventListener('dormy-local-data-changed', onLocalChange);
    window.addEventListener('dormy-listing-deleted', onListingDeleted);

    return () => {
      window.removeEventListener('storage', onLocalChange);
      window.removeEventListener('dormy-local-data-changed', onLocalChange);
      window.removeEventListener('dormy-listing-deleted', onListingDeleted);
    };
  }, [loadRestrictions]);

  useEffect(() => {
    if (pageRef.current === -1) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    const target = sentinelRef.current;

    if (!target || !hasMore || loading || refreshing || search.trim()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loading, refreshing, listings.length, loadMore, search]);

  // Pull-to-refresh только на самом верху страницы.
  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      startYRef.current =
        window.scrollY <= 0 && !refreshingRef.current
          ? event.touches[0].clientY
          : null;
    };

    const onMove = (event: TouchEvent) => {
      if (startYRef.current === null) return;

      const delta = event.touches[0].clientY - startYRef.current;

      if (delta > 0 && window.scrollY <= 0) {
        if (event.cancelable) event.preventDefault();

        const value = Math.min(delta * 0.5, PULL_MAX);
        pullRef.current = value;
        setPull(value);
      }
    };

    const onEnd = () => {
      if (startYRef.current === null) return;

      startYRef.current = null;

      if (pullRef.current >= PULL_THRESHOLD) {
        refresh();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [refresh]);

  const visibleListings = useMemo(() => {
    const query = search.trim();

    return listings.filter((item) => {
      if (hiddenIds.includes(item.id)) return false;
      if (blockedIds.includes(String(item.telegram_id))) return false;

      if (typeFilter !== 'Все' && item.type !== typeFilter) return false;

      if (!query) return true;

      const searchable = [
        item.title,
        item.description,
        item.location_name ?? '',
        ...(item.tags ?? []),
      ].join(' ');

      return matchesFuzzy(searchable, query);
    });
  }, [listings, hiddenIds, blockedIds, typeFilter, search]);

  const indicatorHeight = refreshing ? 56 : pull;
  const isPulling = pull > 0 && !refreshing;

  return (
    <main className="flex min-h-screen flex-col bg-(--bg-page) pb-28 text-(--text-primary)">
      <Header />

      {/* Поиск */}
      <section className="space-y-3 px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Название, район, удобства..."
            className="w-full rounded-2xl border border-(--card-border) bg-(--input-bg) py-3 pl-10 pr-10 text-sm text-(--text-primary) outline-none transition focus:border-blue-600/50"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-(--text-secondary)"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {(['Все', 'Аренда', 'Продажа'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-(--input-bg) text-(--text-secondary)'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((value) => !value)}
            aria-expanded={filterOpen}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
              filterOpen
                ? 'bg-blue-600/10 text-blue-600'
                : 'bg-(--input-bg) text-(--text-secondary)'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Фильтры
          </button>
        </div>

        {filterOpen && (
          <div className="rounded-2xl border border-(--card-border) bg-(--card-bg) p-3">
            <p className="mb-2 text-xs font-bold text-(--text-secondary)">
              Тип объявления
            </p>

            <div className="flex gap-2">
              {(['Все', 'Аренда', 'Продажа'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    typeFilter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-(--input-bg) text-(--text-primary)'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-(--text-secondary)">
              Поиск проверяет название, описание, локацию и удобства, включая небольшие опечатки.
            </p>
          </div>
        )}
      </section>

      {/* Индикатор обновления */}
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{
          height: indicatorHeight,
          transition: isPulling ? 'none' : 'height 0.25s ease',
        }}
      >
        <div
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-(--card-border) bg-(--card-bg) text-blue-600 shadow-md"
          style={{ opacity: refreshing ? 1 : Math.min(pull / PULL_THRESHOLD, 1) }}
        >
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown
              className="h-5 w-5 transition-transform"
              style={{
                transform: `rotate(${pull >= PULL_THRESHOLD ? 180 : 0}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Лента */}
      <div className="flex-1 space-y-4 p-4">
        {loading && listings.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : visibleListings.length === 0 ? (
          <div className="space-y-2 py-16 text-center">
            <p className="text-sm font-bold text-(--text-primary)">
              {search ? 'Ничего не найдено' : 'Объявлений пока нет'}
            </p>
            <p className="text-xs text-(--text-secondary)">
              {search
                ? 'Попробуйте изменить запрос или убрать фильтры.'
                : 'Станьте первым, кто разместит жильё в Dormy!'}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('Все');
                }}
                className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                Сбросить поиск
              </button>
            )}
          </div>
        ) : (
          <>
            {visibleListings.map((item) => (
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

            {!search.trim() && (
              <div
                ref={sentinelRef}
                className="flex min-h-16 justify-center py-6"
              >
                {loading && (
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                )}

                {!hasMore && !loading && listings.length > 0 && (
                  <p className="text-center text-[11px] text-(--text-secondary)/70">
                    Вы посмотрели все доступные объявления
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}