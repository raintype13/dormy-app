'use client';

import {
  ImagePlus,
  DollarSign,
  MapPin,
  Shield,
  X,
  Plus,
  Check,
  LoaderCircle,
} from 'lucide-react';

import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from 'react';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Language = 'RU' | 'UZ' | 'EN';
type ListingType = 'Аренда' | 'Продажа';
type Currency = 'UZS' | 'USD' | 'RUB';
type RentalPeriod = 'day' | 'week' | 'month' | 'year';

const DEVELOPER_ID = 1949612933;

const AVAILABLE_TAGS = [
  'Wi-Fi',
  'Отопление',
  'Кондиционер',
  'Стиралка',
  'Холодильник',
  'Балкон',
];

const TEXT = {
  RU: {
    title: 'Новое объявление',
    photos: 'Фотографии жилья',
    photoLimit: 'До 5 фотографий',
    addPhoto: 'Добавить',
    purpose: 'Цель объявления',
    rent: 'Аренда',
    sale: 'Продажа',
    heading: 'Название объявления',
    headingPlaceholder: 'Например: 2-комнатная квартира возле СамГУ',
    price: 'Цена',
    currency: 'Валюта',
    period: 'Период аренды',
    day: 'За день',
    week: 'За неделю',
    month: 'За месяц',
    year: 'За год',
    location: 'Ориентир / локация',
    locationPlaceholder: 'Улица, район или ориентир',
    amenities: 'Удобства',
    customTag: 'Добавить своё удобство',
    customTagPlaceholder: 'Например: парковка',
    description: 'Описание',
    descriptionPlaceholder: 'Опишите жильё, условия и требования к жильцам...',
    publish: 'Опубликовать объявление',
    publishing: 'Публикация объявления...',
    developer: 'Панель разработчика',
    ownerId: 'Telegram ID владельца объявления',
    currentOwner: 'ID автора',
    success: 'Объявление опубликовано',
    error: 'Не удалось опубликовать объявление',
    photoError: 'Можно загрузить максимум 5 фотографий',
    titleRequired: 'Введите название объявления',
    priceRequired: 'Введите корректную цену',
    locationRequired: 'Укажите локацию',
    tagExists: 'Такое удобство уже добавлено',
    removePhoto: 'Удалить фотографию',
    choosePhotos: 'Выберите фотографии',
  },

  UZ: {
    title: 'Yangi e’lon',
    photos: 'Uy fotosuratlari',
    photoLimit: 'Ko‘pi bilan 5 ta surat',
    addPhoto: 'Qo‘shish',
    purpose: 'E’lon turi',
    rent: 'Ijara',
    sale: 'Sotuv',
    heading: 'E’lon nomi',
    headingPlaceholder: 'Masalan: universitet yaqinidagi 2 xonali uy',
    price: 'Narx',
    currency: 'Valyuta',
    period: 'Ijara muddati',
    day: 'Kunlik',
    week: 'Haftalik',
    month: 'Oylik',
    year: 'Yillik',
    location: 'Manzil / mo‘ljal',
    locationPlaceholder: 'Ko‘cha, tuman yoki mo‘ljal',
    amenities: 'Qulayliklar',
    customTag: 'Qulaylik qo‘shish',
    customTagPlaceholder: 'Masalan: avtoturargoh',
    description: 'Tavsif',
    descriptionPlaceholder: 'Uy, shartlar va talablarni tasvirlab bering...',
    publish: 'E’lonni joylashtirish',
    publishing: 'E’lon joylashtirilmoqda...',
    developer: 'Dasturchi paneli',
    ownerId: 'E’lon egasining Telegram ID raqami',
    currentOwner: 'Muallif ID raqami',
    success: 'E’lon joylashtirildi',
    error: 'E’lonni joylashtirib bo‘lmadi',
    photoError: 'Ko‘pi bilan 5 ta surat yuklash mumkin',
    titleRequired: 'E’lon nomini kiriting',
    priceRequired: 'To‘g‘ri narxni kiriting',
    locationRequired: 'Manzilni kiriting',
    tagExists: 'Bu qulaylik allaqachon qo‘shilgan',
    removePhoto: 'Suratni o‘chirish',
    choosePhotos: 'Suratlarni tanlang',
  },

  EN: {
    title: 'New listing',
    photos: 'Property photos',
    photoLimit: 'Up to 5 photos',
    addPhoto: 'Add',
    purpose: 'Listing type',
    rent: 'Rent',
    sale: 'Sale',
    heading: 'Listing title',
    headingPlaceholder: 'For example: 2-bedroom apartment near university',
    price: 'Price',
    currency: 'Currency',
    period: 'Rental period',
    day: 'Per day',
    week: 'Per week',
    month: 'Per month',
    year: 'Per year',
    location: 'Location',
    locationPlaceholder: 'Street, district or landmark',
    amenities: 'Amenities',
    customTag: 'Add a custom amenity',
    customTagPlaceholder: 'For example: parking',
    description: 'Description',
    descriptionPlaceholder: 'Describe the property, terms and requirements...',
    publish: 'Publish listing',
    publishing: 'Publishing listing...',
    developer: 'Developer panel',
    ownerId: 'Listing owner Telegram ID',
    currentOwner: 'Author ID',
    success: 'Listing published',
    error: 'Failed to publish listing',
    photoError: 'You can upload up to 5 photos',
    titleRequired: 'Enter a listing title',
    priceRequired: 'Enter a valid price',
    locationRequired: 'Enter a location',
    tagExists: 'This amenity has already been added',
    removePhoto: 'Remove photo',
    choosePhotos: 'Choose photos',
  },
} as const;

export default function CreateListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>('RU');

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    first_name: string;
  } | null>(null);

  const [targetTelegramId, setTargetTelegramId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    type: 'Аренда' as ListingType,
    currency: 'UZS' as Currency,
    rentalPeriod: 'month' as RentalPeriod,
    locationName: '',
    description: '',
    tags: [] as string[],
  });

  const [customTag, setCustomTag] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);

  const t = TEXT[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');

    if (savedLang === 'RU' || savedLang === 'UZ' || savedLang === 'EN') {
      setLang(savedLang);
    }

    const tgUser = (
      window as Window & {
        Telegram?: {
          WebApp?: {
            initDataUnsafe?: {
              user?: {
                id: number;
                first_name: string;
              };
            };
          };
        };
      }
    ).Telegram?.WebApp?.initDataUnsafe?.user;

    if (tgUser) {
      setCurrentUser(tgUser);
      setTargetTelegramId(String(tgUser.id));
    } else {
      // Удобно для локальной разработки в обычном браузере.
      const devUser = {
        id: DEVELOPER_ID,
        first_name: 'Developer',
      };

      setCurrentUser(devUser);
      setTargetTelegramId(String(DEVELOPER_ID));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToast('');
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const isDev = currentUser?.id === DEVELOPER_ID;

  const showToast = (message: string, isError = false) => {
    setToast(message);
    setToastError(isError);
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag],
    }));
  };

  const addCustomTag = () => {
    const tag = customTag.trim();

    if (!tag) return;

    if (
      formData.tags.some(
        (existing) => existing.toLowerCase() === tag.toLowerCase()
      )
    ) {
      showToast(t.tagExists, true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));

    setCustomTag('');
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);

    if (!selectedFiles.length) return;

    const remaining = 5 - photos.length;

    if (selectedFiles.length > remaining) {
      showToast(t.photoError, true);
    }

    const accepted = selectedFiles
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining);

    const nextPhotos = [...photos, ...accepted];

    setPhotos(nextPhotos);
    setPhotoPreviews(
      nextPhotos.map((file) => URL.createObjectURL(file))
    );

    // Позволяет повторно выбрать тот же файл.
    input.value = '';
  };

  const removePhoto = (index: number) => {
    const nextPhotos = photos.filter((_, i) => i !== index);

    setPhotos(nextPhotos);
    setPhotoPreviews(
      nextPhotos.map((file) => URL.createObjectURL(file))
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const title = formData.title.trim();
    const locationName = formData.locationName.trim();
    const price = Number(formData.price);

    if (!title) {
      showToast(t.titleRequired, true);
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showToast(t.priceRequired, true);
      return;
    }

    if (!locationName) {
      showToast(t.locationRequired, true);
      return;
    }

    if (!currentUser) {
      showToast('Telegram user is not available', true);
      return;
    }

    setLoading(true);

    try {
      const activeTelegramId =
        isDev && targetTelegramId.trim()
          ? targetTelegramId.trim()
          : String(currentUser.id);

      const uniqueSuffix = Math.random()
        .toString(36)
        .substring(2, 7);

      const customId = `${activeTelegramId}_${Date.now()}_${uniqueSuffix}`;

      const uploadedPhotoUrls: string[] = [];

      for (const file of photos) {
        const fileExt = file.name.split('.').pop() || 'jpg';

        const fileName =
          `${customId}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError.message);
          throw new Error(
            `Не удалось загрузить фотографию: ${file.name}`
          );
        }

        const { data: publicURLData } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(fileName);

        if (publicURLData?.publicUrl) {
          uploadedPhotoUrls.push(publicURLData.publicUrl);
        }
      }

      const payload = {
        id: customId,
        telegram_id: activeTelegramId,
        title,
        price,
        type: formData.type,
        location_name: locationName,
        description: formData.description.trim(),
        tags: formData.tags,
        photos: uploadedPhotoUrls,
        currency: formData.currency,
        rental_period:
          formData.type === 'Аренда'
            ? formData.rentalPeriod
            : null,
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Ошибка при сохранении объявления'
        );
      }

      showToast(t.success);

      window.setTimeout(() => {
        router.push('/profile');
        router.refresh();
      }, 700);
    } catch (error) {
      console.error('Listing submission error:', error);

      const message =
        error instanceof Error ? error.message : t.error;

      showToast(message || t.error, true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-(--card-border) bg-(--input-bg) px-4 py-3 text-sm font-medium text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition';

  const labelClass =
    'mb-2 block text-xs font-bold uppercase tracking-wider text-(--text-secondary)';

  return (
    <main
      className="min-h-screen bg-(--bg-page) px-4 pb-32 text-(--text-primary)"
      style={{
        paddingTop:
          'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px)) + var(--tg-content-safe-area-inset-top, 0px) + 24px)',
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">
          {t.title}
        </h1>

        <p className="mt-1 text-sm text-(--text-secondary)">
          Dormy
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isDev && (
          <section className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600">
              <Shield className="h-4 w-4" />
              {t.developer}
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder={t.ownerId}
              value={targetTelegramId}
              onChange={(e) => setTargetTelegramId(e.target.value)}
              className={inputClass}
            />

            <p className="text-xs text-(--text-secondary)">
              {t.currentOwner}:{' '}
              <span className="font-mono font-bold text-amber-600">
                {targetTelegramId}
              </span>
            </p>
          </section>
        )}

        {/* Фотографии */}
        <section>
          <div className={labelClass}>{t.photos}</div>

          <p className="mb-3 text-xs text-(--text-secondary)">
            {t.photoLimit}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((preview, index) => (
              <div
                key={`${preview}-${index}`}
                className="relative aspect-square overflow-hidden rounded-2xl border border-(--card-border) bg-(--input-bg)"
              >
                <img
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={t.removePhoto}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-(--card-border) bg-(--input-bg)/50 transition hover:border-blue-600/50 active:scale-[0.98]">
                <ImagePlus className="h-7 w-7 text-blue-600" />

                <span className="text-xs font-bold text-(--text-secondary)">
                  {t.addPhoto}
                </span>

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
        </section>

        {/* Тип объявления */}
        <section>
          <label className={labelClass}>{t.purpose}</label>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-(--input-bg) p-1">
            {(['Аренда', 'Продажа'] as const).map((type) => {
              const active = formData.type === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type }))
                  }
                  className={`rounded-xl py-3 text-sm font-bold transition active:scale-[0.98] ${
                    active
                      ? 'bg-(--card-bg) text-(--text-primary) shadow-sm'
                      : 'text-(--text-secondary)'
                  }`}
                >
                  {type === 'Аренда' ? t.rent : t.sale}
                </button>
              );
            })}
          </div>
        </section>

        {/* Заголовок */}
        <section>
          <label className={labelClass}>{t.heading}</label>

          <input
            required
            maxLength={120}
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder={t.headingPlaceholder}
            className={inputClass}
          />
        </section>

        {/* Цена и валюта */}
        <section className="space-y-3">
          <label className={labelClass}>{t.price}</label>

          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />

              <input
                required
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                placeholder="1500000"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              aria-label={t.currency}
              value={formData.currency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value as Currency,
                }))
              }
              className={inputClass}
            >
              <option value="UZS">UZS</option>
              <option value="USD">USD</option>
              <option value="RUB">RUB</option>
            </select>
          </div>

          {/* Период только для аренды */}
          {formData.type === 'Аренда' && (
            <div>
              <label className={labelClass}>{t.period}</label>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['day', t.day],
                    ['week', t.week],
                    ['month', t.month],
                    ['year', t.year],
                  ] as const
                ).map(([value, label]) => {
                  const active = formData.rentalPeriod === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          rentalPeriod: value,
                        }))
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                        active
                          ? 'border-blue-600 bg-blue-600/10 text-blue-600'
                          : 'border-(--card-border) bg-(--input-bg) text-(--text-primary)'
                      }`}
                    >
                      {label}
                      {active && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Локация */}
        <section>
          <label className={labelClass}>{t.location}</label>

          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-secondary)" />

            <input
              required
              maxLength={200}
              value={formData.locationName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  locationName: e.target.value,
                }))
              }
              placeholder={t.locationPlaceholder}
              className={`${inputClass} pl-10`}
            />
          </div>
        </section>

        {/* Удобства */}
        <section>
          <label className={labelClass}>{t.amenities}</label>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => {
              const active = formData.tags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition active:scale-95 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-(--input-bg) text-(--text-primary)'
                  }`}
                >
                  {active && (
                    <Check className="mr-1 inline h-3.5 w-3.5" />
                  )}
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={customTag}
              maxLength={40}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder={t.customTagPlaceholder}
              className={`${inputClass} min-w-0 flex-1`}
            />

            <button
              type="button"
              onClick={addCustomTag}
              aria-label={t.customTag}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition active:scale-90"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Добавленные пользовательские удобства */}
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.tags
              .filter((tag) => !AVAILABLE_TAGS.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600/10 px-3 py-2 text-xs font-semibold text-blue-600"
                >
                  {tag}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
          </div>
        </section>

        {/* Описание */}
        <section>
          <label className={labelClass}>{t.description}</label>

          <textarea
            rows={5}
            maxLength={5000}
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder={t.descriptionPlaceholder}
            className={`${inputClass} resize-none`}
          />
        </section>

        {/* Кнопка публикации */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-(--card-border) bg-(--bg-page)/90 p-4 pb-[max(env(safe-area-inset-bottom),16px)] backdrop-blur-xl">
          <div className="w-full max-w-md">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t.publishing}
                </>
              ) : (
                t.publish
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Неблокирующее уведомление */}
      {toast && (
        <div
          role="status"
          className={`fixed left-4 right-4 top-5 z-100 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${
            toastError
              ? 'border-red-500/20 bg-red-500 text-white'
              : 'border-emerald-500/20 bg-emerald-600 text-white'
          }`}
        >
          <span>{toast}</span>

          <button
            type="button"
            onClick={() => setToast('')}
            aria-label="Close notification"
            className="shrink-0 rounded-full p-1 transition active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}