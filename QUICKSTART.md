# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database
1. Create a MySQL database:
```sql
CREATE DATABASE school_management;
```

2. Update `.env` file:
```env
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
```

### Step 3: Initialize Database
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Login
- Open http://localhost:3000
- Login with:
  - **Email**: admin@school.com
  - **Password**: admin123

## 📋 Default Credentials

After seeding:
- **Super Admin**: admin@school.com / admin123
- **School Admin**: admin@demoschool.com / admin123

## 🐳 Docker Quick Start

```bash
docker-compose up -d
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

Access at http://localhost:3000

## 📁 Project Structure

```
app/
├── (auth)/          # Login, Register pages
├── (dashboard)/     # All dashboard pages
│   ├── dashboard/   # Main dashboard
│   ├── admin/        # Super admin pages
│   └── ...
├── (public)/         # Public landing page
└── api/              # API routes

components/
├── layouts/          # Sidebar, TopNav
└── ui/               # Reusable UI components

lib/
├── auth.ts           # Authentication utilities
├── permissions.ts    # RBAC permissions
├── i18n.ts          # Internationalization
├── theme.ts         # Theming system
└── prisma.ts        # Prisma client
```

## 🎯 Key Features

✅ Multi-tenant architecture
✅ Role-based access control
✅ Multi-language support (6 languages)
✅ Dynamic theming per school
✅ Complete CRUD operations
✅ Search and pagination
✅ JWT authentication
✅ Responsive design

## 🔧 Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## 📚 Next Steps

1. Customize school settings
2. Add more students and staff
3. Configure classes and subjects
4. Set up fees and payments
5. Customize theme colors
6. Add more languages if needed

## 🆘 Troubleshooting

**Database connection error?**
- Check MySQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Prisma errors?**
- Run `npx prisma generate`
- Run `npx prisma db push`

**Port already in use?**
- Change port in package.json scripts
- Or kill process using port 3000

## 📞 Support

For issues, check the README.md or open an issue on GitHub.

