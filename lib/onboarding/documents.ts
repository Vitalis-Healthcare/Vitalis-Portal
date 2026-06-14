// lib/onboarding/documents.ts
// Document-type catalog + Storage helpers for candidate uploads (Phase 2).
// All document types are OPTIONAL — staff can send the application back with a
// request for any that are missing (see staff side, v0.6.3-b).
import { createServiceClient } from '@/lib/supabase/service'

type Svc = ReturnType<typeof createServiceClient>

export const DOCUMENTS_BUCKET = 'onboarding-documents'

// Per-file cap. Kept under Vercel's serverless request-body limit (~4.5 MB)
// because uploads are proxied through the API route. Larger files would need a
// signed-upload-URL direct-to-Storage flow — a future enhancement if needed.
export const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const ACCEPTED_ACCEPT_ATTR = '.pdf,.jpg,.jpeg,.png'

export type DocTypeDef = { key: string; label: string; hint?: string }

// The catalog the candidate sees. Every type is optional.
export const ONB_DOCUMENT_TYPES: DocTypeDef[] = [
  { key: 'photo_id',        label: 'Government-issued photo ID', hint: 'Driver’s license or state ID' },
  { key: 'ssn_card',        label: 'Social Security card' },
  { key: 'credential',      label: 'Professional credential / certification', hint: 'CNA, GNA, LPN, RN, etc.' },
  { key: 'cpr',             label: 'CPR / First Aid certification' },
  { key: 'tb_test',         label: 'TB test (PPD) result' },
  { key: 'physical',        label: 'Physical examination form' },
  { key: 'resume',          label: 'Résumé' },
  { key: 'other',           label: 'Other supporting document' },
]

export function docTypeLabel(key: string): string {
  return ONB_DOCUMENT_TYPES.find((d) => d.key === key)?.label || key
}

export function isAcceptedMime(mime: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(mime)
}

// Sanitize a user-supplied filename to a storage-safe leaf.
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return cleaned || 'file'
}

export type StoredDocument = {
  id: string
  doc_type: string
  file_name: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_at: string
}

// Short-lived signed URL for a private object (used by staff to view a file).
export async function createDocumentSignedUrl(
  svc: Svc,
  storagePath: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const { data, error } = await svc.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}
