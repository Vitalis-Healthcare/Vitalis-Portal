import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const svc = createServiceClient()

  // Search title, doc_id, keywords array, and html_content (stripped via regex server-side)
  // Use ilike on title and doc_id, and contains on keywords array
  const { data: byMeta } = await svc
    .from('pp_policies')
    .select('doc_id, title, domain, version, keywords, status')
    .in('status', ['active', 'under-review'])
    .or(`title.ilike.%${q}%,doc_id.ilike.%${q}%`)
    .order('doc_id')
    .limit(20)

  // Keyword array search (Postgres array contains)
  const { data: byKeyword } = await svc
    .from('pp_policies')
    .select('doc_id, title, domain, version, keywords, status')
    .in('status', ['active', 'under-review'])
    .contains('keywords', [q.toLowerCase()])
    .order('doc_id')
    .limit(10)

  // Full content search via ilike on html_content (finds any word in policy body)
  const { data: byHtml } = await svc
    .from('pp_policies')
    .select('doc_id, title, domain, version, keywords, status')
    .in('status', ['active', 'under-review'])
    .ilike('html_content', `%${q}%`)
    .order('doc_id')
    .limit(15)

  // Merge and deduplicate — title/ID matches ranked highest
  const seen = new Set<string>()
  const results: { doc_id: string; title: string; domain: string; version: string; match_type: string }[] = []

  const add = (items: any[] | null, matchType: string) => {
    for (const item of items || []) {
      if (!seen.has(item.doc_id)) {
        seen.add(item.doc_id)
        results.push({ ...item, match_type: matchType })
      }
    }
  }

  add(byMeta, 'title')
  add(byKeyword, 'keyword')
  add(byHtml, 'content')

  return NextResponse.json({ results: results.slice(0, 20) })
}
