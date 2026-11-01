'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ListingCard } from '@/components/ListingCard';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

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

const PAGE_SIZE = 6; // Количество объявлений на одну порцию

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Функция загрузки очередной порции объявлений
  const fetchListings = useCallback(async (pageIndex: number) => {
    if (loading || (!hasMore && pageIndex !== 0)) return;

    setLoading(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Ошибка при подгрузке объявлений:', error);
        return;
      }

      if (data) {
        if (data.length < PAGE_SIZE) {
          setHasMore(false); // Больше объявлений в базе нет
        }

        setListings(prev => (pageIndex === 0 ? data : [...prev, ...data]));
      }
    } catch (err) {
      console.error('Сбой сети:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // Первоначальная загрузка
  useEffect(() => {
    fetchListings(0);
  }, []);

  // Отслеживание скролла для бесконечной ленты
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            fetchListings(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, fetchListings]);

  return (
    <main className="flex flex-col min-h-screen bg-(--bg-page) text-(--text-primary) pb-28">
      <Header />

      <div className="p-4 space-y-4 flex-1">
        {listings.length === 0 && !loading ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-sm font-bold text-(--text-primary)">Объявлений пока нет</p>
            <p className="text-xs text-(--text-secondary)">Станьте первым, кто разместит жильё в Dormy!</p>
          </div>
        ) : (
          listings.map(item => (
            <ListingCard 
              key={item.id} 
              title={item.title}
              price={item.price}
              type={item.type as 'Аренда' | 'Продажа'}
              locationName={item.location_name}
              tags={item.tags}
              photos={item.photos}
            />
          ))
        )}

        {/* Триггер для бесконечного скролла и лоадер */}
        <div ref={observerTarget} className="py-6 flex justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-500/10 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка новых вариантов...
            </div>
          )}
          {!hasMore && listings.length > 0 && (
            <p className="text-[11px] font-medium text-(--text-secondary)/60 text-center">
              Вы посмотрели все доступные объявления ✨
            </p>
          )}
        </div>
      </div>
    </main>
  );
}