'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowDown } from 'lucide-react';

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

const PAGE_SIZE = 6;          // объявлений в одной порции
const PULL_THRESHOLD = 70;    // px, после которых отпускание запускает обновление
const PULL_MAX = 110;         // px, максимальная «оттяжка»
const MIN_SPINNER_MS = 600;   // чтобы обновление не мелькало

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);        // подгрузка следующей порции / первая загрузка
  const [hasMore, setHasMore] = useState(true);
  const [pull, setPull] = useState(0);                   // текущая оттяжка в px
  const [refreshing, setRefreshing] = useState(false);

  const pageRef = useRef(-1); // индекс последней загруженной страницы
  const loadingRef = useRef(false);
  const refreshingRef = useRef(false);
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Загрузка очередной порции (вниз по ленте)
  const loadMore = useCallback(async () => {
    if (loadingRef.current || refreshingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchPage(nextPage);
      pageRef.current = nextPage;
      setListings((prev) => (nextPage === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Ошибка при подгрузке объявлений:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [fetchPage]);

  // Обновление ленты (pull-to-refresh)
  const refresh = useCallback(async () => {
    if (refreshingRef.current || loadingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const [data] = await Promise.all([fetchPage(0), wait(MIN_SPINNER_MS)]);
      pageRef.current = 0;
      setListings(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Ошибка при обновлении:', err);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      pullRef.current = 0;
      setPull(0);
    }
  }, [fetchPage]);

  // Первая загрузка
  useEffect(() => {
    loadMore();
  }, [loadMore]);

  // Бесконечная лента: грузим следующую порцию, только когда дошли до конца списка
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore || loading || refreshing || listings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, refreshing, listings.length, loadMore]);

  // Pull-to-refresh: потянуть вниз, когда лента в самом верху
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      startYRef.current = window.scrollY <= 0 && !refreshingRef.current ? e.touches[0].clientY : null;
    };

    const onMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;

      if (dy > 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
        const value = Math.min(dy * 0.5, PULL_MAX);
        pullRef.current = value;
        setPull(value);
      }
    };

    const onEnd = () => {
      if (startYRef.current === null) return;
      startYRef.current = null;

      if (pullRef.current >= PULL_THRESHOLD) refresh();
      else {
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

  const indicatorHeight = refreshing ? 56 : pull;
  const isPulling = pull > 0 && !refreshing;

  return (
    <main className="flex flex-col min-h-screen bg-(--bg-page) text-(--text-primary) pb-28">
      <Header />

      {/* Индикатор обновления — круг, как на YouTube */}
      <div
        className="flex items-end justify-center overflow-hidden"
        style={{
          height: indicatorHeight,
          transition: isPulling ? 'none' : 'height 0.25s ease',
        }}
      >
        <div
          className="mb-2 w-9 h-9 rounded-full bg-(--card-bg) border border-(--card-border) shadow-md flex items-center justify-center text-blue-600"
          style={{ opacity: refreshing ? 1 : Math.min(pull / PULL_THRESHOLD, 1) }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown
              className="w-5 h-5 transition-transform"
              style={{ transform: `rotate(${pull >= PULL_THRESHOLD ? 180 : 0}deg)` }}
            />
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {listings.length === 0 && !loading && !refreshing ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-sm font-bold text-(--text-primary)">Объявлений пока нет</p>
            <p className="text-xs text-(--text-secondary)">Станьте первым, кто разместит жильё в Dormy!</p>
          </div>
        ) : (
          listings.map((item) => (
            <ListingCard
              key={item.id}
              id={item.id}
              telegram_id={item.telegram_id}
              title={item.title}
              price={item.price}
              type={item.type}
              locationName={item.location_name}
              tags={item.tags}
              photos={item.photos}
              createdAt={item.created_at}
            />
          ))
        )}

        {/* Триггер конца списка + кружок загрузки */}
        <div ref={sentinelRef} className="py-6 flex justify-center min-h-16">
          {loading && (
            <div className="w-9 h-9 rounded-full bg-(--card-bg) border border-(--card-border) shadow-md flex items-center justify-center text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {!hasMore && !loading && listings.length > 0 && (
            <p className="text-[11px] font-medium text-(--text-secondary)/60 text-center">
              Вы посмотрели все доступные объявления
            </p>
          )}
        </div>
      </div>
    </main>
  );
}