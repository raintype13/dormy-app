'use client';

import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    // В будущем здесь будет подгрузка избранного из localStorage или Supabase
    const savedFavs = JSON.parse(localStorage.getItem('dormy_favorites') || '[]');
    setFavorites(savedFavs);
  }, []);

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) p-4 pb-28 space-y-4">
      <h1 className="text-lg font-black tracking-tight">Избранные варианты</h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-(--input-bg) flex items-center justify-center text-(--text-secondary)">
            <Heart className="w-8 h-8 opacity-40" />
          </div>
          <div>
            <p className="text-sm font-bold text-(--text-primary)">Список пуст</p>
            <p className="text-xs text-(--text-secondary) mt-1">Добавляйте понравившиеся объявления в избранное, чтобы не потерять</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Здесь в будущем будет рендер карточек */}
        </div>
      )}
    </main>
  );
}