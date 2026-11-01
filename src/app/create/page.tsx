'use client';

import { ArrowLeft, ImagePlus, DollarSign, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, ChangeEvent, FormEvent } from 'react';

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    type: 'Аренда' as 'Аренда' | 'Продажа',
    locationName: '',
    description: '',
    tags: [] as string[],
  });

  const [photos, setPhotos] = useState<File[]>([]);

  const availableTags = ['Wi-Fi', 'Отопление', 'Кондиционер', 'Стиралка', 'Холодильник', 'Балкон'];

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...filesArray].slice(0, 5));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const generatedId = `lst_${Math.random().toString(36).substring(2, 8)}`;

    try {
      const payload = {
        id: generatedId,
        title: formData.title,
        price: Number(formData.price),
        type: formData.type,
        location_name: formData.locationName,
        description: formData.description,
        tags: formData.tags,
        photos: [], // Пока передаем массив пустой, позже подключим загрузку file_id
      };

      // Отправляем данные на наш серверный API-роут для сохранения в Supabase
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при сохранении');
      }

      console.log('Объявление успешно создано в базе:', result.listing);
      alert(`Объявление успешно опубликовано! ID: ${generatedId}`);
      
      // Плавный переход на главную страницу без закрытия приложения
      router.push('/');
    } catch (err: any) {
      console.error('Ошибка отправки:', err);
      alert(`Не удалось опубликовать: ${err.message || 'Попробуйте снова'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-(--bg-page) text-(--text-primary) p-4 pb-28">
      {/* Шапка */}
      <div className="flex items-center gap-3 pt-2 pb-4">
        <button 
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-2xl bg-(--input-bg) text-(--text-primary) hover:opacity-80 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Новое объявление</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 1. Загрузка Фотографии */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block">
            Фотографии жилья (до 5 шт)
          </label>
          
          <div className="grid grid-cols-3 gap-2">
            {photos.map((_, index) => (
              <div key={index} className="relative h-24 rounded-2xl bg-(--input-bg) overflow-hidden border border-(--card-border) flex items-center justify-center text-[10px] text-(--text-secondary) font-mono">
                [Фото {index + 1}]
              </div>
            ))}

            {photos.length < 5 && (
              <label className="h-24 rounded-2xl border-2 border-dashed border-(--card-border) hover:border-blue-600/50 bg-(--input-bg)/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <ImagePlus className="w-6 h-6 text-blue-600" />
                <span className="text-[10px] font-bold text-(--text-secondary)">Добавить</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handlePhotoSelect} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        {/* 2. Тип (Аренда / Продажа) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block">
            Цель объявления
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-(--input-bg) rounded-2xl">
            {(['Аренда', 'Продажа'] as const).map(type => (
              <button
                type="button"
                key={type}
                onClick={() => setFormData(p => ({ ...p, type }))}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.type === type 
                    ? 'bg-(--card-bg) text-(--text-primary) shadow-sm' 
                    : 'text-(--text-secondary)'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Заголовок и Цена */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block mb-1">
              Название / Заголовок
            </label>
            <input 
              type="text"
              required
              placeholder="Напр: 2-комн. квартира возле СамГУ"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-3 bg-(--input-bg) text-(--text-primary) rounded-2xl text-xs font-medium focus:outline-none border border-transparent focus:border-blue-600/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block mb-1">
              Цена в месяц ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
              <input 
                type="number"
                required
                placeholder="180"
                value={formData.price}
                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-(--input-bg) text-(--text-primary) rounded-2xl text-xs font-bold focus:outline-none border border-transparent focus:border-blue-600/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* 4. Конкретное место */}
        <div>
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block mb-1">
            Ориентир / Локация
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-secondary)" />
            <input 
              type="text"
              required
              placeholder="Напр: Ул. Университетский бульвар, СамГУ"
              value={formData.locationName}
              onChange={e => setFormData(p => ({ ...p, locationName: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-(--input-bg) text-(--text-primary) rounded-2xl text-xs font-medium focus:outline-none border border-transparent focus:border-blue-600/50 transition-all"
            />
          </div>
        </div>

        {/* 5. Удобства (Теги) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block">
            Удобства
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const active = formData.tags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-(--input-bg) text-(--text-primary)'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Подробное описание */}
        <div>
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block mb-1">
            Описание
          </label>
          <textarea 
            rows={4}
            placeholder="Опишите состояние квартиры, требования к жильцам и условия..."
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            className="w-full p-4 bg-(--input-bg) text-(--text-primary) rounded-2xl text-xs font-medium focus:outline-none border border-transparent focus:border-blue-600/50 transition-all resize-none"
          />
        </div>

        {/* Кнопка публикации */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-(--bg-page)/80 backdrop-blur-md border-t border-(--card-border) z-40 flex justify-center">
          <div className="w-full max-w-md">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Публикация...' : 'Опубликовать объявление'}
            </button>
          </div>
        </div>

      </form>
    </main>
  );
}