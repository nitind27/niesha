# Codeat Schoolify - SaaS Platform

A complete, production-ready, multi-tenant SaaS school management platform built with Next.js, TypeScript, Tailwind CSS, and MySQL.

## Features

### 🏫 Multi-Tenant Architecture
- Single codebase, multiple schools
- Complete data isolation using `school_id`
- Per-school customization (colors, branding, settings)

### 👥 User Roles
- Super Admin (SaaS Owner)
- School Admin
- Principal
- Teacher
- Student
- Parent
- Accountant
- HR Manager
- Librarian
- Transport Manager

### 📚 Modules
- **Student Lifecycle**: Admission to graduation
- **Staff & HR**: Employee management
- **Academic Management**: Classes, subjects, schedules
- **Examination & Results**: Exams and grade management
- **Attendance**: Student and staff attendance tracking
- **Fees & Finance**: Fee management and payment processing
- **Library**: Book management and issue tracking
- **Transport**: Route and vehicle management
- **Communication**: Announcements and notifications
- **Analytics & Reports**: Comprehensive reporting

### 🌍 Internationalization
- Multi-language support (English, Spanish, French, German, Hindi, Arabic)
- Easy language switching
- Per-school language preferences

### 🎨 Theming
- Dynamic color customization per school
- Custom logos and branding
- Dark/Light mode support

### 🔒 Security
- JWT authentication
- Role-based access control (RBAC)
- Password hashing
- Protected routes
- API authorization middleware
- Tenant-level data isolation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Zod
- **UI Components**: Radix UI, Lucide Icons

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd school
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL:
```
DATABASE_URL="mysql://user:password@localhost:3306/school_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
```

4. Set up the database:
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials

After seeding:
- **Super Admin**: admin@school.com / admin123
- **School Admin**: admin@demoschool.com / admin123

## Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Run migrations:
```bash
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

## Project Structure

```
school/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/
│   ├── layouts/         # Layout components
│   └── ui/              # UI components
├── lib/                 # Utilities and helpers
├── hooks/               # React hooks
├── middleware.ts        # Next.js middleware
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed
└── public/              # Static files
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students (with pagination, search, filters)
- `POST /api/students` - Create student
- `GET /api/students/[id]` - Get student details
- `PATCH /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Development

### Database Commands
```bash
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

### Build for Production
```bash
npm run build
npm start
```

## Features in Detail

### Multi-Tenant Architecture
Every table includes `school_id` for data isolation. The middleware automatically filters queries based on the authenticated user's school.

### Role-Based Access Control
Permissions are defined per role, and API routes check permissions before allowing access.

### Internationalization
The system supports multiple languages with easy switching. Translations are stored in `lib/i18n.ts` and can be extended.

### Theming
Each school can customize:
- Primary, secondary, and accent colors
- Logo and favicon
- School name and branding

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for modern schools

