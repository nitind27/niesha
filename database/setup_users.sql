-- ============================================================
-- DEFAULT USER CREDENTIALS SETUP
-- ============================================================
-- This file contains INSERT queries for default users
-- Copy and paste these queries directly into MySQL
--
-- NOTE: These queries use ON DUPLICATE KEY UPDATE
-- If user already exists, it will UPDATE instead of INSERT
-- This prevents duplicate entry errors
-- ============================================================

-- ============================================================
-- SUPER ADMIN (System Administrator)
-- ============================================================
-- Email: superadmin@school.com
-- Password: superadmin123
-- Role: super_admin (role_001)
-- Access: Full system access, can manage all schools
-- schoolId: NULL (system-wide access)
-- ============================================================

INSERT INTO `users` (
  `id`, 
  `schoolId`, 
  `email`, 
  `password`, 
  `firstName`, 
  `lastName`, 
  `phone`, 
  `avatar`, 
  `roleId`, 
  `language`, 
  `timezone`, 
  `isActive`, 
  `lastLoginAt`, 
  `emailVerified`, 
  `createdAt`, 
  `updatedAt`, 
  `deletedAt`
) VALUES (
  'user_001', 
  NULL, 
  'superadmin@school.com', 
  '$2a$12$CXXLWKL75SuhhIP/aXlMH.CCYYjCrQTE8qC3DeNZ4lMOWozV8u2Ua', 
  'Super', 
  'Admin', 
  NULL, 
  NULL, 
  'role_001', 
  'en', 
  'UTC', 
  1, 
  NULL, 
  1, 
  NOW(), 
  NOW(), 
  NULL
) ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password` = VALUES(`password`),
  `firstName` = VALUES(`firstName`),
  `lastName` = VALUES(`lastName`),
  `roleId` = VALUES(`roleId`),
  `schoolId` = VALUES(`schoolId`),
  `isActive` = VALUES(`isActive`),
  `emailVerified` = VALUES(`emailVerified`),
  `updatedAt` = NOW();

-- ============================================================
-- SCHOOL ADMIN (School Administrator) - admin@school.com
-- ============================================================
-- Email: admin@school.com
-- Password: admin123
-- Role: school_admin (role_002)
-- Access: Manages assigned school (school_001)
-- schoolId: school_001 (Demo School)
-- ============================================================

INSERT INTO `users` (
  `id`, 
  `schoolId`, 
  `email`, 
  `password`, 
  `firstName`, 
  `lastName`, 
  `phone`, 
  `avatar`, 
  `roleId`, 
  `language`, 
  `timezone`, 
  `isActive`, 
  `lastLoginAt`, 
  `emailVerified`, 
  `createdAt`, 
  `updatedAt`, 
  `deletedAt`
) VALUES (
  'user_002', 
  'school_001', 
  'admin@school.com', 
  '$2a$12$jmVGOwVYCX34QdXYhaHRnuARRu1Z48QpZJ4SsmXoCEsLUibXWjgKO', 
  'School', 
  'Admin', 
  NULL, 
  NULL, 
  'role_002', 
  'en', 
  'UTC', 
  1, 
  NULL, 
  1, 
  NOW(), 
  NOW(), 
  NULL
) ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password` = VALUES(`password`),
  `firstName` = VALUES(`firstName`),
  `lastName` = VALUES(`lastName`),
  `roleId` = VALUES(`roleId`),
  `schoolId` = VALUES(`schoolId`),
  `isActive` = VALUES(`isActive`),
  `emailVerified` = VALUES(`emailVerified`),
  `updatedAt` = NOW();

-- ============================================================
-- SCHOOL ADMIN (School Administrator) - admin@demoschool.com
-- ============================================================
-- Email: admin@demoschool.com
-- Password: admin123
-- Role: school_admin (role_002)
-- Access: Manages only assigned school (school_001)
-- schoolId: school_001 (Demo School)
-- ============================================================

INSERT INTO `users` (
  `id`, 
  `schoolId`, 
  `email`, 
  `password`, 
  `firstName`, 
  `lastName`, 
  `phone`, 
  `avatar`, 
  `roleId`, 
  `language`, 
  `timezone`, 
  `isActive`, 
  `lastLoginAt`, 
  `emailVerified`, 
  `createdAt`, 
  `updatedAt`, 
  `deletedAt`
) VALUES (
  'user_003', 
  'school_001', 
  'admin@demoschool.com', 
  '$2a$12$6PTTb6YQCIOterRROKWqFe62p8dUfrN1LkA4NTLLkbo1MOsZz/qOS', 
  'School', 
  'Admin', 
  NULL, 
  NULL, 
  'role_002', 
  'en', 
  'UTC', 
  1, 
  NULL, 
  1, 
  NOW(), 
  NOW(), 
  NULL
) ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password` = VALUES(`password`),
  `firstName` = VALUES(`firstName`),
  `lastName` = VALUES(`lastName`),
  `roleId` = VALUES(`roleId`),
  `schoolId` = VALUES(`schoolId`),
  `isActive` = VALUES(`isActive`),
  `emailVerified` = VALUES(`emailVerified`),
  `updatedAt` = NOW();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these queries to verify users were created successfully
-- ============================================================

-- Check all users
SELECT 
  id, 
  email, 
  firstName, 
  lastName, 
  roleId, 
  schoolId, 
  isActive, 
  emailVerified 
FROM users 
WHERE deletedAt IS NULL;

-- Check Super Admin
SELECT 
  u.id, 
  u.email, 
  u.firstName, 
  u.lastName, 
  r.name as role_name,
  r.displayName as role_display,
  u.schoolId,
  u.isActive
FROM users u
JOIN roles r ON u.roleId = r.id
WHERE u.email = 'superadmin@school.com' 
  AND u.deletedAt IS NULL;

-- Check School Admin (admin@school.com)
SELECT 
  u.id, 
  u.email, 
  u.firstName, 
  u.lastName, 
  r.name as role_name,
  r.displayName as role_display,
  r.id as role_id,
  s.name as school_name,
  u.schoolId,
  u.isActive
FROM users u
JOIN roles r ON u.roleId = r.id
LEFT JOIN schools s ON u.schoolId = s.id
WHERE u.email = 'admin@school.com' 
  AND u.deletedAt IS NULL;

-- Check School Admin (admin@demoschool.com)
SELECT 
  u.id, 
  u.email, 
  u.firstName, 
  u.lastName, 
  r.name as role_name,
  r.displayName as role_display,
  r.id as role_id,
  s.name as school_name,
  u.schoolId,
  u.isActive
FROM users u
JOIN roles r ON u.roleId = r.id
LEFT JOIN schools s ON u.schoolId = s.id
WHERE u.email = 'admin@demoschool.com' 
  AND u.deletedAt IS NULL;

-- ============================================================
-- LOGIN CREDENTIALS SUMMARY
-- ============================================================
-- SUPER ADMIN:
--   Email: superadmin@school.com
--   Password: superadmin123
--   Role ID: role_001
--   Redirect: /admin/super (Super Admin Panel)
--
-- SCHOOL ADMIN:
--   Email: admin@school.com
--   Password: admin123
--   Role ID: role_002
--   Redirect: /dashboard (Admin Panel)
--
-- SCHOOL ADMIN (Alternative):
--   Email: admin@demoschool.com
--   Password: admin123
--   Role ID: role_002
--   Redirect: /dashboard (Admin Panel)
-- ============================================================
--
-- ============================================================
-- ROLE IDs REFERENCE
-- ============================================================
-- role_001 = super_admin (Super Admin)
-- role_002 = school_admin (School Admin)
-- role_003 = principal (Principal)
-- role_004 = teacher (Teacher)
-- role_005 = student (Student)
-- role_006 = parent (Parent)
-- role_007 = accountant (Accountant)
-- role_008 = hr_manager (HR Manager)
-- role_009 = librarian (Librarian)
-- role_010 = transport_manager (Transport Manager)
-- ============================================================

