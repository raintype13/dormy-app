import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET listings:', error.message);

    return NextResponse.json(
      { error: 'Не удалось загрузить объявления' },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id ?? '').trim();
    const telegramId = String(body.telegram_id ?? '').trim();
    const title = String(body.title ?? '').trim();
    const type = String(body.type ?? '').trim();
    const locationName = String(
      body.location_name ?? body.locationName ?? body.location ?? ''
    ).trim();

    const price = Number(body.price);
    const description = String(body.description ?? '').trim();

    const currency = String(body.currency ?? 'UZS').toUpperCase();

    const rentalPeriod =
      type === 'Продажа'
        ? null
        : String(body.rental_period ?? 'month');

    const allowedCurrencies = ['UZS', 'USD', 'RUB'];
    const allowedPeriods = ['day', 'week', 'month', 'year'];
    const allowedTypes = ['Аренда', 'Продажа'];

    if (!id || !telegramId || !title || !type) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Цена должна быть больше нуля' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Неизвестный тип объявления' },
        { status: 400 }
      );
    }

    if (!allowedCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Неизвестная валюта' },
        { status: 400 }
      );
    }

    if (rentalPeriod && !allowedPeriods.includes(rentalPeriod)) {
      return NextResponse.json(
        { error: 'Неизвестный период аренды' },
        { status: 400 }
      );
    }

    const tags = Array.isArray(body.tags)
      ? body.tags
          .filter((tag: unknown): tag is string => typeof tag === 'string')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : [];

    const photos = Array.isArray(body.photos)
      ? body.photos.filter(
          (photo: unknown): photo is string => typeof photo === 'string'
        )
      : [];

    const { data, error } = await supabase
      .from('listings')
      .insert({
        id,
        telegram_id: telegramId,
        title,
        price,
        type,
        location_name: locationName || null,
        description,
        tags,
        photos,
        currency,
        rental_period: rentalPeriod,
        views: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('POST listings:', error.message);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, listing: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST listings exception:', error);

    return NextResponse.json(
      { error: 'Не удалось обработать объявление' },
      { status: 500 }
    );
  }
}