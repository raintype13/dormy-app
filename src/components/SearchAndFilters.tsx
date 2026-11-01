'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

export const SearchAndFilters = () => {
  const [activeTab, setActiveTab] = useState<'housing' | 'roommate'>('housing');

  return (
    <div className="p-4 space-y-3 bg-white dark:bg-black transition-colors">
      {/* Переключатель категорий */}
      <div className="p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center">
        <button
          onClick={() => setActiveTab('housing')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'housing'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Поиск жилья
        </button>
        <button
          onClick={() => setActiveTab('roommate')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'roommate'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
        >
          Поиск сожителя
        </button>
      </div>
ы
      {/* Поле поиска и параметры */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Ориентир, вуз или район..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl text-xs font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition-all"
          />
        </div>
        <button className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};