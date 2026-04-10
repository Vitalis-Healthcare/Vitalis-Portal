import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// PATCH { name? }  — rename only, safer than allowing kind/type changes
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const patch: Record<string, any> = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('cf_categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

// DELETE — hard delete. Will fail if category is referenced by transactions/rules
// (foreign key). In that case the UI should instruct the user to migrate first.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sb = createServiceClient();
  const { error } = await sb.from('cf_categories').delete().eq('id', id);
  if (error) {
    // Friendly error when FK blocks delete
    if (error.code === '23503') {
      return NextResponse.json({
        error: 'This category is in use by transactions or rules. Delete or reassign those first.'
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
