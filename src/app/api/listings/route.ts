import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Получение всех объявлений для ленты
export async function GET() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Создание нового объявления
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          id: body.id,
          title: body.title,
          price: Number(body.price),
          type: body.type,
          location_name: body.location,
          description: body.description,
          tags: body.tags || [],
          photos: body.photos || [],
          views: 0,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, listing: data[0] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}