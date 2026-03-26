// app/api/credentials/add-document/route.ts
// Handles versioned document storage for credentials.
// Uses service role to safely update is_latest flags across rows.
// Called after every file upload — never deletes previous versions.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  // Verify caller is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { staffCredentialId, documentUrl, fileName } = await request.json()
  if (!staffCredentialId || !documentUrl) {
    return NextResponse.json(
      { error: 'staffCredentialId and documentUrl are required' },
      { status: 400 }
    )
  }

  const svc = createServiceClient()

  // Get current max version number for this credential
  const { data: existing } = await svc
    .from('credential_documents')
    .select('version_number')
    .eq('staff_credential_id', staffCredentialId)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = (existing?.[0]?.version_number ?? 0) + 1

  // Mark all current latest docs for this credential as superseded
  await svc
    .from('credential_documents')
    .update({ is_latest: false })
    .eq('staff_credential_id', staffCredentialId)
    .eq('is_latest', true)

  // Insert the new version as latest
  const { data: newDoc, error: insertError } = await svc
    .from('credential_documents')
    .insert({
      staff_credential_id: staffCredentialId,
      document_url:        documentUrl,
      file_name:           fileName || null,
      uploaded_by:         user.id,
      version_number:      nextVersion,
      is_latest:           true,
    })
    .select()
    .single()

  if (insertError) {
    console.error('add-document insert error:', insertError.message)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Keep staff_credentials.document_url in sync with latest (backwards compat)
  await svc
    .from('staff_credentials')
    .update({ document_url: documentUrl })
    .eq('id', staffCredentialId)

  return NextResponse.json({ success: true, document: newDoc, version: nextVersion })
}
