'use client';

import { ArrowLeft, ImagePlus, DollarSign, MapPin, Shield, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Данные текущего пользователя и разработчика
  const [currentUser, setCurrentUser] = useState<{ id: number; first_name: string } | null>(null);
  const [targetTelegramId, setTargetTelegramId] = useState<string>('');
  const DEVELOPER_ID = 1949612933;

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    type: 'Аренда' as 'Аренда' | 'Продажа',
    locationName: '',
    description: '',
    tags: [] as string[],
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const availableTags = ['Wi-Fi', 'Отопление', 'Кондиционер', 'Стиралка', 'Холодильник', 'Балкон'];

  useEffect(() => {
    // Получаем реального юзера из Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = (window as any).Telegram.WebApp.initDataUnsafe.user;
      setCurrentUser(tgUser);
      setTargetTelegramId(tgUser.id.toString());
    } else {
      // Фолбэк для разработки в браузере (подставляем твой дев-аккаунт)
      const mockUser = { id: DEVELOPER_ID, first_name: 'Loan Graves' };
      setCurrentUser(mockUser);
      setTargetTelegramId(mockUser.id.toString());
    }
  }, []);

  const isDev = currentUser?.id === DEVELOPER_ID;

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
      const newPhotos = [...photos, ...filesArray].slice(0, 5);
      setPhotos(newPhotos);

      // Генерируем превью для отображения в инпуте
      const newPreviews = newPhotos.map(file => URL.createObjectURL(file));
      setPhotoPreviews(newPreviews);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const activeTelegramId = isDev && targetTelegramId ? targetTelegramId : (currentUser?.id.toString() || '1949612933');

      // 1. Считаем количество объявлений пользователя для создания красивого ID вида {telegram_id}_{index}
      const { count, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('telegram_id', activeTelegramId);

      if (countError) console.error('Ошибка подсчета:', countError);

      const nextIndex = (count || 0) + 1;
      const customId = `${activeTelegramId}_${nextIndex}`;

      // 2. Загружаем фотографии в Supabase Storage (бакет "listing-photos")
      const uploadedPhotoUrls: string[] = [];

      for (const file of photos) {
        const fileExt = file.name.split('.').pop();
        for (const file of photos) {
      const fileExt = file.name.split('.').pop();
      // Исправленная строка (правильные скобки у Math.random().toString(36))
      const fileName = `${customId}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Ошибка загрузки фото:', uploadError.message);
        continue;
      }

      // Получаем публичную ссылку на фото
      const { data: publicURLData } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(filePath);

      if (publicURLData?.publicUrl) {
        uploadedPhotoUrls.push(publicURLData.publicUrl);
      }
    }
        const filePath = `${__filename}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Ошибка загрузки фото:', uploadError.message);
          continue;
        }

        // Получаем публичную ссылку на фото
        const { data: publicURLData } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(filePath);

        if (publicURLData?.publicUrl) {
          uploadedPhotoUrls.push(publicURLData.publicUrl);
        }
      }

      // 3. Формируем полезную нагрузку для сохранения в базу данных
      const payload = {
        id: customId,
        telegram_id: activeTelegramId,
        title: formData.title,
        price: Number(formData.price),
        type: formData.type,
        location_name: formData.locationName,
        description: formData.description,
        tags: formData.tags,
        photos: uploadedPhotoUrls, // Сохраняем реальные ссылки на фото из базы
      };

      // Отправляем данные на серверный API или напрямую в Supabase
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при сохранении в базу');
      }

      alert(`Объявление успешно опубликовано! ID: ${customId}`);
      router.push('/profile');
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
        
        {/* Блок прав разработчика: выбор от чьего имени публикация */}
        {isDev && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
              <Shield className="w-4 h-4" />
              <span>Панель разработчика: Создание от имени пользователя</span>
            </div>
            <input 
              type="text"
              placeholder="Введите Telegram ID владельца объявления"
              value={targetTelegramId}
              onChange={e => setTargetTelegramId(e.target.value)}
              className="w-full px-3 py-2 bg-(--input-bg) text-(--text-primary) rounded-xl text-xs font-mono border border-amber-500/30 focus:outline-none"
            />
            <p className="text-[10px] text-(--text-secondary)">
              Текущий ID автора: <span className="font-mono font-bold text-amber-600">{targetTelegramId}</span>
            </p>
          </div>
        )}

        {/* 1. Загрузка Фотографии */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider block">
            Фотографии жилья (до 5 шт)
          </label>
          
          <div className="grid grid-cols-3 gap-2">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative h-24 rounded-2xl bg-(--input-bg) overflow-hidden border border-(--card-border)">
                <img src={preview} alt="" className="w-full h-full object-cover" />
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
              {loading ? 'Публикация и загрузка фото...' : 'Опубликовать объявление'}
            </button>
          </div>
        </div>

      </form>
    </main>
  );
}