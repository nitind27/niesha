# Database Roles Reference

## Role IDs and Names

| Role ID | Role Name | Display Name | Description |
|---------|-----------|--------------|-------------|
| `role_001` | `super_admin` | Super Admin | Full system access, can manage all schools |
| `role_002` | `school_admin` | School Admin | School administrator, manages assigned school |
| `role_003` | `principal` | Principal | Principal role with read access |
| `role_004` | `teacher` | Teacher | Teacher role with class management |
| `role_005` | `student` | Student | Student role with limited access |
| `role_006` | `parent` | Parent | Parent role for viewing student info |
| `role_007` | `accountant` | Accountant | Accountant role for fee management |
| `role_008` | `hr_manager` | HR Manager | HR Manager role for staff management |
| `role_009` | `librarian` | Librarian | Librarian role for library management |
| `role_010` | `transport_manager` | Transport Manager | Transport Manager role |

## Default Users

### Super Admin
- **Email**: `superadmin@school.com`
- **Password**: `superadmin123`
- **Role ID**: `role_001` (super_admin)
- **schoolId**: `NULL` (system-wide access)
- **Redirect After Login**: `/admin/super` (Super Admin Panel)
- **Sidebar**: Only shows "Super Admin" link

### School Admin (Primary)
- **Email**: `admin@school.com`
- **Password**: `admin123`
- **Role ID**: `role_002` (school_admin)
- **schoolId**: `school_001` (Demo School)
- **Redirect After Login**: `/dashboard` (Admin Panel)
- **Sidebar**: Shows all school management menu items (Students, Staff, Classes, etc.)

### School Admin (Alternative)
- **Email**: `admin@demoschool.com`
- **Password**: `admin123`
- **Role ID**: `role_002` (school_admin)
- **schoolId**: `school_001` (Demo School)
- **Redirect After Login**: `/dashboard` (Admin Panel)
- **Sidebar**: Shows all school management menu items

## Login Flow

1. **Super Admin Login** (`superadmin@school.com`):
   - Authenticates with `role_001`
   - Redirects to `/admin/super`
   - Sidebar shows only "Super Admin" link
   - Can access: Admin Management, Roles & Permissions, Subscription Plans

2. **School Admin Login** (`admin@school.com` or `admin@demoschool.com`):
   - Authenticates with `role_002`
   - Redirects to `/dashboard`
   - Sidebar shows full admin menu:
     - Dashboard
     - Students
     - Staff
     - Classes
     - Subjects
     - Exams
     - Results
     - Attendance
     - Fees
     - Payments
     - Library
     - Transport
     - Announcements
     - Reports
     - Settings

## SQL Queries to Check Roles

```sql
-- View all roles
SELECT id, name, displayName, description FROM roles WHERE deletedAt IS NULL;

-- View all users with their roles
SELECT 
  u.id, 
  u.email, 
  u.firstName, 
  u.lastName, 
  r.id as role_id,
  r.name as role_name,
  r.displayName as role_display,
  u.schoolId,
  u.isActive
FROM users u
JOIN roles r ON u.roleId = r.id
WHERE u.deletedAt IS NULL
ORDER BY r.id, u.email;

-- Check specific user role
SELECT 
  u.email,
  r.id as role_id,
  r.name as role_name,
  r.displayName as role_display
FROM users u
JOIN roles r ON u.roleId = r.id
WHERE u.email = 'admin@school.com' AND u.deletedAt IS NULL;
```

## Notes

- **Super Admin** (`role_001`) has `schoolId = NULL` and can access all schools
- **School Admin** (`role_002`) has `schoolId = 'school_001'` and can only access assigned school
- All passwords are hashed using bcrypt with 12 rounds
- Role-based UI is automatically handled by the sidebar component
- Login redirects are based on role in `app/(auth)/login/page.tsx`

