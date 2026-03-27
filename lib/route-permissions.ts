// Route to Permission mapping
// This maps each route to the required permission

import { PERMISSIONS } from "./permissions"

export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Dashboard
  "/dashboard": [PERMISSIONS.SETTINGS_READ], // Basic access
  
  // Students
  "/dashboard/students": [PERMISSIONS.STUDENT_READ],
  
  // Staff
  "/dashboard/staff": [PERMISSIONS.STAFF_READ],
  
  // Classes
  "/dashboard/classes": [PERMISSIONS.CLASS_READ],
  
  // Subjects
  "/dashboard/subjects": [PERMISSIONS.SUBJECT_READ],
  
  // Exams
  "/dashboard/exams": [PERMISSIONS.EXAM_READ],
  
  // Results
  "/dashboard/results": [PERMISSIONS.RESULT_READ],
  
  // Attendance
  "/dashboard/attendance": [PERMISSIONS.ATTENDANCE_READ],
  
  // Fees
  "/dashboard/fees": [PERMISSIONS.FEE_READ],
  
  // Payments
  "/dashboard/payments": [PERMISSIONS.PAYMENT_READ],
  
  // Library
  "/dashboard/library": [PERMISSIONS.LIBRARY_READ],
  
  // Transport
  "/dashboard/transport": [PERMISSIONS.TRANSPORT_READ],
  
  // Announcements
  "/dashboard/announcements": [PERMISSIONS.ANNOUNCEMENT_READ],
  
  // Reports
  "/dashboard/reports": [PERMISSIONS.REPORT_READ],
  
  // Settings
  "/dashboard/settings": [PERMISSIONS.SETTINGS_READ],

  // ERP suite (multi-sector: school, company, trust)
  "/dashboard/erp": [PERMISSIONS.ERP_READ],
  "/dashboard/crm": [PERMISSIONS.ERP_READ],
  "/dashboard/inventory": [PERMISSIONS.ERP_READ],
  "/dashboard/projects": [PERMISSIONS.ERP_READ],
  "/dashboard/documents": [PERMISSIONS.ERP_READ],
  
  // Super Admin
  "/admin/super": [PERMISSIONS.SUPER_ADMIN_ALL],
}

// Get required permission for a route
export function getRoutePermission(pathname: string): string[] {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }
  
  // Check if pathname starts with any route
  for (const [route, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return permissions
    }
  }
  
  // Default: require basic settings read
  return [PERMISSIONS.SETTINGS_READ]
}

// Check if user has permission for a route
export function canAccessRoute(userPermissions: string[], pathname: string): boolean {
  const requiredPermissions = getRoutePermission(pathname)
  
  // Super admin has access to everything
  if (userPermissions.includes(PERMISSIONS.SUPER_ADMIN_ALL)) {
    return true
  }
  
  // Check if user has any of the required permissions
  return requiredPermissions.some((permission) => userPermissions.includes(permission))
}

