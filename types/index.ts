export type UserRole = 'admin' | 'supervisor' | 'caregiver'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  hire_date?: string
  phone?: string
  department?: string
  status: 'active' | 'inactive'
  avatar_url?: string
  created_at: string
}

// LMS
export type CourseStatus = 'draft' | 'published' | 'archived'
export type SectionType = 'text' | 'pdf' | 'video' | 'quiz'

export interface Course {
  id: string
  title: string
  description?: string
  category: string
  status: CourseStatus
  created_by: string
  estimated_minutes?: number
  thumbnail_color?: string
  created_at: string
  updated_at: string
  sections?: CourseSection[]
  enrollment_count?: number
  completion_count?: number
}

export interface CourseSection {
  id: string
  course_id: string
  title: string
  type: SectionType
  content?: string
  video_url?: string
  pdf_url?: string
  order_index: number
  created_at: string
  quiz_questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  section_id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
}

export interface CourseEnrollment {
  id: string
  user_id: string
  course_id: string
  assigned_by?: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  progress_pct: number
  course?: Course
  profile?: Profile
}

export interface SectionProgress {
  id: string
  enrollment_id: string
  section_id: string
  completed_at: string
  quiz_score?: number
}

// Policies
export type PolicyStatus = 'draft' | 'published' | 'archived'

export interface Policy {
  id: string
  title: string
  category: string
  content: string
  version: string
  status: PolicyStatus
  effective_date?: string
  created_by: string
  created_at: string
  updated_at: string
  acknowledgement_count?: number
  total_staff?: number
}

export interface PolicyAcknowledgement {
  id: string
  policy_id: string
  user_id: string
  version_signed: string
  signed_at: string
  policy?: Policy
  profile?: Profile
}

// Credentials
export interface CredentialType {
  id: string
  name: string
  validity_days: number
  required_for_roles: UserRole[]
  reminder_days: number[]
  created_at: string
}

export interface StaffCredential {
  id: string
  user_id: string
  credential_type_id: string
  issue_date: string
  expiry_date?: string
  document_url?: string
  notes?: string
  status: 'current' | 'expiring' | 'expired' | 'missing'
  created_at: string
  updated_at: string
  credential_type?: CredentialType
  profile?: Profile
}
