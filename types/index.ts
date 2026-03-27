// Type definitions for the application

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  roleId: string
  schoolId?: string
  language: string
  avatar?: string
}

export interface School {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  status: string
  subscriptionPlan: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  defaultLanguage: string
}

export interface Student {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: string
  classId?: string
  sectionId?: string
  status: string
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  pagination?: PaginationParams
}

