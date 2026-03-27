# Environment Variables Setup Guide

## 📋 Quick Setup

### Step 1: Create .env file
```bash
# Copy the example file
cp .env.example .env

# Or create manually
touch .env
```

### Step 2: Update Database URL
`.env` file में अपना database connection string update करें:

```env
DATABASE_URL="mysql://username:password@localhost:3306/school_management?schema=public"
```

**Examples:**

Local MySQL (default password):
```env
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"
```

Local MySQL (no password):
```env
DATABASE_URL="mysql://root@localhost:3306/school_management?schema=public"
```

Remote MySQL:
```env
DATABASE_URL="mysql://user:pass@your-host.com:3306/school_management?schema=public"
```

### Step 3: Generate JWT Secret
```bash
# Generate a strong secret key
openssl rand -base64 32
```

या online tool use करें: https://generate-secret.vercel.app/32

### Step 4: Update JWT Secret
```env
JWT_SECRET="your-generated-secret-key-here"
```

## 🔐 Required Variables

### Minimum Required
```env
DATABASE_URL="mysql://user:pass@host:port/database?schema=public"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

## 📝 Environment Files

### `.env` - Main environment file
- Default for all environments
- Git ignored (should not be committed)

### `.env.local` - Local development
- Overrides `.env` for local development
- Git ignored

### `.env.production` - Production
- Production-specific variables
- Git ignored

### `.env.example` - Template
- Example file with all variables
- Should be committed to git

## 🔒 Security Best Practices

### 1. Never Commit .env Files
`.gitignore` में ensure करें:
```
.env
.env.local
.env.production
.env*.local
```

### 2. Use Strong Secrets
- JWT_SECRET: Minimum 32 characters
- Use random strings, not words
- Generate using: `openssl rand -base64 32`

### 3. Different Secrets for Each Environment
- Development: `dev-secret-key`
- Production: `prod-secret-key` (completely different)

### 4. Rotate Secrets Regularly
- Change JWT_SECRET periodically
- Update all active sessions

## 🚀 Environment-Specific Setup

### Development
```env
NODE_ENV="development"
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"
JWT_SECRET="dev-secret-key"
```

### Production
```env
NODE_ENV="production"
DATABASE_URL="mysql://prod_user:STRONG_PASS@prod_host:3306/school_management?schema=public"
JWT_SECRET="STRONG-PRODUCTION-SECRET"
```

## 🔧 Common Configurations

### MySQL Connection String Format
```
mysql://[username]:[password]@[host]:[port]/[database]?schema=public
```

### Examples:
```env
# Local with password
DATABASE_URL="mysql://root:mypassword@localhost:3306/school_management?schema=public"

# Local without password
DATABASE_URL="mysql://root@localhost:3306/school_management?schema=public"

# Remote server
DATABASE_URL="mysql://user:pass@db.example.com:3306/school_management?schema=public"

# With SSL
DATABASE_URL="mysql://user:pass@host:3306/school_management?schema=public&sslmode=require"
```

## ✅ Verification

### Check if .env is loaded
```bash
# In your code
console.log(process.env.DATABASE_URL)
```

### Test Database Connection
```bash
# Using Prisma
npx prisma db push

# Or test connection
npx prisma studio
```

## 🐛 Troubleshooting

### Error: DATABASE_URL not found
- Check if `.env` file exists
- Verify file is in project root
- Restart development server

### Error: Invalid database URL
- Check MySQL is running
- Verify credentials
- Test connection manually

### Error: JWT_SECRET too short
- Minimum 32 characters required
- Generate new secret: `openssl rand -base64 32`

### Environment variables not loading
- Restart Next.js dev server
- Check file name is exactly `.env`
- Verify no syntax errors in .env file

## 📋 Complete .env Template

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# App
NODE_ENV="development"
PORT=3000
```

## 🔄 Updating Environment Variables

1. Edit `.env` file
2. Restart development server
3. For production, restart application server

## 📞 Need Help?

- Check `.env.example` for all available variables
- Verify database connection string format
- Ensure all required variables are set
- Check server logs for specific errors

