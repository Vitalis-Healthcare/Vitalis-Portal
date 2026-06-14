// app/api/onboarding/documents/route.ts
// Public, token-gated document upload + delete for the candidate application.
// Uploads are proxied through this route to the PRIVATE Storage bucket via the
// service-role client (the candidate never gets direct bucket access). All
// document types are optional; this route just stores what the candidate sends.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  APPLICATION_EDITABLE_STATUSES,
} from '@/lib/onboarding/application'
import {
  DOCUMENTS_BUCKET, MAX_FILE_BYTES, isAcceptedMime, safeFileName, ONB_DOCUMENT_TYPES,
} from '@/lib/onboarding/documents'

export const dynamic = 'force-dynamic'

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

type Svc = ReturnType<typeof createServiceClient>

async function candidateForToken(svc: Svc, token: string) {
  if (!token) return { error: 'Missing token.', status: 400 as const }
  const { data: cand } = await svc
    .from('onb_candidates')
    .select('id, status, token_expires_at')
    .eq('access_token', hashToken(token))
    .single()
  if (!cand) return { error: 'invalid_token', status: 404 as const }
  if (cand.token_expires_at && new Date(cand.token_expires_at) < new Date()) {
    return { error: 'expired_token', status: 410 as const }
  }
  if (!(APPLICATION_EDITABLE_STATUSES as readonly string[]).includes(cand.status || '')) {
    return { error: 'not_editable', status: 409 as const }
  }
  return { cand }
}

export async function POST(req: NextRequest) {
  const svc = createServiceClient()

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
  }

  const token = String(fd.get('token') || '')
  const docType = String(fd.get('doc_type') || 'other')
  const file = fd.get('file')

  const gate = await candidateForToken(svc, token)
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const cand = gate.cand

  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 })
  if (file.size === 0) return NextResponse.json({ error: 'The file appears to be empty.' }, { status: 400 })
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `That file is too large. Please upload up to ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB.` }, { status: 413 })
  }
  if (!isAcceptedMime(file.type)) {
    return NextResponse.json({ error: 'Please upload a PDF, JPG, or PNG file.' }, { status: 415 })
  }
  const validType = ONB_DOCUMENT_TYPES.some((d) => d.key === docType) ? docType : 'other'

  const leaf = `${crypto.randomUUID()}__${safeFileName(file.name)}`
  const storagePath = `${cand.id}/${leaf}`

  const bytes = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await svc.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false })
  if (upErr) {
    console.error('[onboarding-documents] storage upload failed:', upErr.message)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const { data: inserted, error: insErr } = await svc
    .from('onb_documents')
    .insert({
      candidate_id: cand.id,
      doc_type: validType,
      file_name: file.name.slice(0, 200),
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select('id, doc_type, file_name, storage_path, mime_type, size_bytes, uploaded_at')
    .single()

  if (insErr || !inserted) {
    // Roll back the orphaned object so we don't leave a file with no row.
    await svc.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
    console.error('[onboarding-documents] insert failed:', insErr?.message)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, document: inserted })
}

export async function DELETE(req: NextRequest) {
  const svc = createServiceClient()
  const body = await req.json().catch(() => ({}))
  const token = String(body.token || '')
  const id = String(body.id || '')

  const gate = await candidateForToken(svc, token)
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const cand = gate.cand

  if (!id) return NextResponse.json({ error: 'Missing document id.' }, { status: 400 })

  // Confirm the document belongs to this candidate before touching anything.
  const { data: doc } = await svc
    .from('onb_documents')
    .select('id, storage_path, candidate_id')
    .eq('id', id)
    .single()
  if (!doc || doc.candidate_id !== cand.id) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  await svc.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path])
  const { error: delErr } = await svc.from('onb_documents').delete().eq('id', id)
  if (delErr) {
    console.error('[onboarding-documents] delete failed:', delErr.message)
    return NextResponse.json({ error: 'Could not remove that file. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
