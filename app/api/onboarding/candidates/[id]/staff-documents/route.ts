// app/api/onboarding/candidates/[id]/staff-documents/route.ts
//
// Coordinator-uploaded documents (CJIS background check, MBON license).
//
// Separate from the candidate's own upload route: this one is staff-gated by
// session rather than by a candidate token, and it only accepts doc types from
// the staff catalog. Files go to the same private bucket through the service
// client, so nothing is ever publicly readable.
//
// Dynamic route -> params must be awaited (pitfalls #5).

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  DOCUMENTS_BUCKET, MAX_FILE_BYTES, isAcceptedMime, safeFileName,
} from '@/lib/onboarding/documents'
import { ONB_STAFF_DOCUMENT_TYPES, isStaffDocType } from '@/lib/onboarding/staff-documents'

export const dynamic = 'force-dynamic'

async function staffGate(): Promise<{ ok: true; userId: string } | { ok: false; res: NextResponse }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
    const svc = createServiceClient()
    const { data: profile } = await svc.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role
    if (!(role === 'admin' || role === 'supervisor' || role === 'staff')) {
      return { ok: false, res: NextResponse.json({ error: 'Staff access required' }, { status: 403 }) }
    }
    return { ok: true, userId: user.id }
  } catch {
    return { ok: false, res: NextResponse.json({ error: 'Auth check failed' }, { status: 500 }) }
  }
}

// ── GET: list the staff-uploaded documents on file ──────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  const svc = createServiceClient()
  const staffKeys = ONB_STAFF_DOCUMENT_TYPES.map((d) => d.key)

  try {
    const { data, error } = await svc
      .from('onb_documents')
      .select('id, doc_type, file_name, storage_path, mime_type, size_bytes, uploaded_at')
      .eq('candidate_id', id)
      .in('doc_type', staffKeys)
      .order('uploaded_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // The bucket is private. Hand back short-lived signed URLs rather than
    // paths, so the viewer never needs bucket access of its own.
    const documents = []
    for (const d of data ?? []) {
      let url: string | null = null
      try {
        const { data: signed } = await svc.storage
          .from(DOCUMENTS_BUCKET)
          .createSignedUrl(d.storage_path, 60 * 30)
        url = signed?.signedUrl ?? null
      } catch {
        url = null
      }
      documents.push({
        id: d.id,
        doc_type: d.doc_type,
        file_name: d.file_name,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        uploaded_at: d.uploaded_at,
        url,
      })
    }

    return NextResponse.json({ success: true, documents })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST: upload one ────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  const svc = createServiceClient()

  const { data: cand } = await svc
    .from('onb_candidates').select('id').eq('id', id).maybeSingle()
  if (!cand) return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 })

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  const docType = String(fd.get('doc_type') || '')
  const file = fd.get('file')

  // Reject rather than coerce: silently filing a background check as "other"
  // would leave the gate open while looking like it had been satisfied.
  if (!isStaffDocType(docType)) {
    return NextResponse.json({ error: 'Unknown document type for a staff upload.' }, { status: 400 })
  }
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: 'That file appears to be empty.' }, { status: 400 })
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({
      error: `That file is too large. Please upload up to ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
    }, { status: 413 })
  }
  if (!isAcceptedMime(file.type)) {
    return NextResponse.json({ error: 'Please upload a PDF, JPG, or PNG file.' }, { status: 415 })
  }

  const leaf = `${crypto.randomUUID()}__${safeFileName(file.name)}`
  const storagePath = `${id}/${leaf}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await svc.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })
  if (upErr) {
    console.error('[staff-documents] storage upload failed:', upErr.message)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const { data: inserted, error: insErr } = await svc
    .from('onb_documents')
    .insert({
      candidate_id: id,
      doc_type: docType,
      file_name: file.name.slice(0, 200),
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select('id, doc_type, file_name, mime_type, size_bytes, uploaded_at')
    .single()

  if (insErr || !inserted) {
    // Roll back the orphaned object rather than leave a file with no row.
    await svc.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    console.error('[staff-documents] insert failed:', insErr?.message)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, document: inserted })
}

// ── DELETE: remove one ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await staffGate()
  if (!g.ok) return g.res

  let docId = ''
  try {
    const body = await req.json()
    docId = String(body.document_id ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!docId) return NextResponse.json({ error: 'document_id is required' }, { status: 400 })

  const svc = createServiceClient()

  const { data: doc } = await svc
    .from('onb_documents')
    .select('id, candidate_id, doc_type, storage_path')
    .eq('id', docId)
    .maybeSingle()

  if (!doc || doc.candidate_id !== id) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }
  if (!isStaffDocType(String(doc.doc_type))) {
    return NextResponse.json({ error: 'That document is not a staff upload.' }, { status: 400 })
  }

  try {
    await svc.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path])
  } catch (err) {
    console.error('[staff-documents] storage remove threw:', err)
  }

  try {
    const { error } = await svc.from('onb_documents').delete().eq('id', docId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
