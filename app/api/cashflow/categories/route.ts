import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_categories')
    .select('id, name, kind, type')
    .order('type').order('kind').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

// POST { name, kind, type }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const kind = String(body.kind || '').trim();
  const type = String(body.type || '').trim();
  if (!name || !kind || !type) {
    return NextResponse.json({ error: 'name, kind, type required' }, { status: 400 });
  }
  if (type !== 'receipt' && type !== 'expense') {
    return NextResponse.json({ error: 'type must be receipt or expense' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_categories')
    .insert({ name, kind, type })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
