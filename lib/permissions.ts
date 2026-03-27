// Permission system for RBAC

export const PERMISSIONS = {
  // Super Admin permissions
  SUPER_ADMIN_ALL: "super_admin:all",
  
  // School Management
  SCHOOL_CREATE: "school:create",
  SCHOOL_READ: "school:read",
  SCHOOL_UPDATE: "school:update",
  SCHOOL_DELETE: "school:delete",
  
  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  
  // Student Management
  STUDENT_CREATE: "student:create",
  STUDENT_READ: "student:read",
  STUDENT_UPDATE: "student:update",
  STUDENT_DELETE: "student:delete",
  
  // Staff Management
  STAFF_CREATE: "staff:create",
  STAFF_READ: "staff:read",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete",
  
  // Academic Management
  CLASS_CREATE: "class:create",
  CLASS_READ: "class:read",
  CLASS_UPDATE: "class:update",
  CLASS_DELETE: "class:delete",
  
  SUBJECT_CREATE: "subject:create",
  SUBJECT_READ: "subject:read",
  SUBJECT_UPDATE: "subject:update",
  SUBJECT_DELETE: "subject:delete",
  
  // Examination
  EXAM_CREATE: "exam:create",
  EXAM_READ: "exam:read",
  EXAM_UPDATE: "exam:update",
  EXAM_DELETE: "exam:delete",
  
  RESULT_CREATE: "result:create",
  RESULT_READ: "result:read",
  RESULT_UPDATE: "result:update",
  RESULT_DELETE: "result:delete",
  
  // Attendance
  ATTENDANCE_CREATE: "attendance:create",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_UPDATE: "attendance:update",
  
  // Fees & Finance
  FEE_CREATE: "fee:create",
  FEE_READ: "fee:read",
  FEE_UPDATE: "fee:update",
  FEE_DELETE: "fee:delete",
  
  PAYMENT_CREATE: "payment:create",
  PAYMENT_READ: "payment:read",
  PAYMENT_UPDATE: "payment:update",
  
  // Library
  LIBRARY_CREATE: "library:create",
  LIBRARY_READ: "library:read",
  LIBRARY_UPDATE: "library:update",
  LIBRARY_DELETE: "library:delete",
  
  // Transport
  TRANSPORT_CREATE: "transport:create",
  TRANSPORT_READ: "transport:read",
  TRANSPORT_UPDATE: "transport:update",
  TRANSPORT_DELETE: "transport:delete",
  
  // Communication
  ANNOUNCEMENT_CREATE: "announcement:create",
  ANNOUNCEMENT_READ: "announcement:read",
  ANNOUNCEMENT_UPDATE: "announcement:update",
  ANNOUNCEMENT_DELETE: "announcement:delete",
  
  // Reports
  REPORT_READ: "report:read",
  REPORT_EXPORT: "report:export",
  
  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // ERP extensions (CRM, inventory, projects — usable by school, company, trust)
  ERP_READ: "erp:read",
  ERP_WRITE: "erp:write",
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/** All defined permission strings (for validation when creating custom roles). */
export const ALL_PERMISSION_VALUES = Object.values(PERMISSIONS) as Permission[]

/** Permissions that may be assigned to custom roles (never super_admin:all). */
export const ASSIGNABLE_PERMISSION_VALUES: string[] = ALL_PERMISSION_VALUES.filter(
  (p) => p !== PERMISSIONS.SUPER_ADMIN_ALL
)

export function isAssignablePermission(p: string): boolean {
  return ASSIGNABLE_PERMISSION_VALUES.includes(p)
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  "super_admin": [
    PERMISSIONS.SUPER_ADMIN_ALL,
  ],
  "school_admin": [
    PERMISSIONS.SCHOOL_READ,
    PERMISSIONS.SCHOOL_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,
    PERMISSIONS.CLASS_CREATE,
    PERMISSIONS.CLASS_READ,
    PERMISSIONS.CLASS_UPDATE,
    PERMISSIONS.CLASS_DELETE,
    PERMISSIONS.SUBJECT_CREATE,
    PERMISSIONS.SUBJECT_READ,
    PERMISSIONS.SUBJECT_UPDATE,
    PERMISSIONS.SUBJECT_DELETE,
    PERMISSIONS.EXAM_CREATE,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.EXAM_UPDATE,
    PERMISSIONS.EXAM_DELETE,
    PERMISSIONS.RESULT_CREATE,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_UPDATE,
    PERMISSIONS.RESULT_DELETE,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.FEE_CREATE,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.FEE_UPDATE,
    PERMISSIONS.FEE_DELETE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.LIBRARY_CREATE,
    PERMISSIONS.LIBRARY_READ,
    PERMISSIONS.LIBRARY_UPDATE,
    PERMISSIONS.LIBRARY_DELETE,
    PERMISSIONS.TRANSPORT_CREATE,
    PERMISSIONS.TRANSPORT_READ,
    PERMISSIONS.TRANSPORT_UPDATE,
    PERMISSIONS.TRANSPORT_DELETE,
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.ANNOUNCEMENT_DELETE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ERP_READ,
    PERMISSIONS.ERP_WRITE,
  ],
  "principal": [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.CLASS_READ,
    PERMISSIONS.SUBJECT_READ,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.ERP_READ,
  ],
  "teacher": [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.CLASS_READ,
    PERMISSIONS.SUBJECT_READ,
    PERMISSIONS.EXAM_CREATE,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.EXAM_UPDATE,
    PERMISSIONS.RESULT_CREATE,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_UPDATE,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
  ],
  "student": [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.CLASS_READ,
    PERMISSIONS.SUBJECT_READ,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.LIBRARY_READ,
    PERMISSIONS.ANNOUNCEMENT_READ,
  ],
  "parent": [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_READ,
  ],
  "accountant": [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.FEE_CREATE,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.FEE_UPDATE,
    PERMISSIONS.FEE_DELETE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.REPORT_READ,
  ],
  "hr_manager": [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.REPORT_READ,
  ],
  "librarian": [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.LIBRARY_CREATE,
    PERMISSIONS.LIBRARY_READ,
    PERMISSIONS.LIBRARY_UPDATE,
    PERMISSIONS.LIBRARY_DELETE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STAFF_READ,
  ],
  "transport_manager": [
    PERMISSIONS.ERP_READ,
    PERMISSIONS.TRANSPORT_CREATE,
    PERMISSIONS.TRANSPORT_READ,
    PERMISSIONS.TRANSPORT_UPDATE,
    PERMISSIONS.TRANSPORT_DELETE,
    PERMISSIONS.STUDENT_READ,
  ],
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return (
    rolePermissions.includes(PERMISSIONS.SUPER_ADMIN_ALL) ||
    rolePermissions.includes(permission)
  )
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

