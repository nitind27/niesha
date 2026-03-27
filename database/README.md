# Database Setup Guide

## 📁 SQL Files

### 1. `schema.sql` - Complete Database Schema
यह file database का complete structure create करती है।

**Usage:**
```bash
mysql -u root -p < database/schema.sql
```

या MySQL command line में:
```sql
source database/schema.sql;
```

### 2. `seed.sql` - Sample Data
यह file initial data insert करती है (roles, users, sample data)।

**Usage:**
```bash
mysql -u root -p < database/seed.sql
```

या MySQL command line में:
```sql
source database/seed.sql;
```

## 🚀 Quick Setup

### Option 1: Using SQL Files (Recommended)

```bash
# 1. Create database and schema
mysql -u root -p < database/schema.sql

# 2. Insert seed data
mysql -u root -p < database/seed.sql
```

### Option 2: Using Prisma (Recommended for Development)

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to database
npx prisma db push

# 3. Seed database
npm run db:seed
```

### Option 3: Using Prisma Migrations

```bash
# 1. Create migration
npx prisma migrate dev --name init

# 2. Seed database
npm run db:seed
```

## 📊 Default Credentials

After running `school_management.sql` or `db:seed`:

### 🔑 Super Admin (System Administrator)
- **Email**: `superadmin@school.com`
- **Password**: `superadmin123`
- **Role**: `super_admin` (role_001)
- **Access**: Full system access, can manage all schools
- **schoolId**: `NULL` (No school assigned - system-wide access)

### 🔑 School Admin (School Administrator)
- **Email**: `admin@demoschool.com`
- **Password**: `admin123`
- **Role**: `school_admin` (role_002)
- **Access**: Manages only assigned school (school_001 - Demo School)
- **schoolId**: `school_001` (Assigned to Demo School)

### ⚠️ Important Notes:
- **Super Admin** has `schoolId = NULL` and can access all schools
- **School Admin** has `schoolId = 'school_001'` and can only access assigned school
- These are default credentials for development/testing
- **Change passwords immediately in production environment**

## 🔧 Database Configuration

`.env` file में database URL set करें:

```env
DATABASE_URL="mysql://username:password@localhost:3306/school_management?schema=public"
```

Example:
```env
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"
```

## 📋 Database Structure

### Core Tables
- `schools` - Multi-tenant schools
- `roles` - User roles and permissions
- `users` - System users

### Student Module
- `students` - Student records
- `parents` - Parent information
- `parent_students` - Parent-Student relations

### Staff Module
- `staff` - Staff/Employee records
- `staff_attendances` - Staff attendance

### Academic Module
- `classes` - Classes/Grades
- `sections` - Sections within classes
- `subjects` - Subjects/Courses

### Examination Module
- `exams` - Examination records
- `exam_results` - Exam results

### Attendance Module
- `attendances` - Student attendance

### Finance Module
- `fees` - Fee structures
- `payments` - Payment records

### Library Module
- `library_books` - Book catalog
- `book_issues` - Book issue records

### Transport Module
- `transport_routes` - Transport routes
- `student_transports` - Student transport assignments

### Communication Module
- `announcements` - School announcements

### Audit Module
- `audit_logs` - System audit logs

## 🔍 Verify Installation

```sql
-- Check if database exists
SHOW DATABASES LIKE 'school_management';

-- Check tables
USE school_management;
SHOW TABLES;

-- Check roles
SELECT * FROM roles;

-- Check users
SELECT * FROM users;
```

## 🛠️ Troubleshooting

### Error: Database already exists
```sql
DROP DATABASE IF EXISTS school_management;
-- Then run schema.sql again
```

### Error: Table already exists
```sql
-- Drop specific table
DROP TABLE IF EXISTS table_name;
-- Or drop entire database and recreate
```

### Error: Foreign key constraint fails
- Make sure to run schema.sql first
- Check if referenced tables exist
- Verify data integrity

### Reset Database
```bash
# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS school_management;"
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## 📝 Notes

- All tables use `utf8mb4` charset for full Unicode support
- All IDs use `VARCHAR(191)` for compatibility
- Soft deletes implemented with `deletedAt` column
- All tables have `createdAt` and `updatedAt` timestamps
- Foreign keys ensure data integrity
- Indexes added for performance optimization

## 🔐 Security Notes

- Default passwords are for development only
- Change passwords in production
- Use strong passwords
- Enable SSL for production database connections
- Regular backups recommended

