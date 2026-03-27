# .env File Creation Guide

## 🚀 Quick Setup

### Step 1: Create .env File

**Windows PowerShell:**
```powershell
cd d:\school
Copy-Item env.example .env
```

**Windows CMD:**
```cmd
cd d:\school
copy env.example .env
```

**Linux/Mac:**
```bash
cd d:\school
cp env.example .env
```

**या manually create करें:**
1. Project root में `d:\school` folder में जाएं
2. New file बनाएं named `.env`
3. नीचे दिया गया content copy करें

### Step 2: Update Database URL

`.env` file खोलें और अपना database connection update करें:

```env
DATABASE_URL="mysql://root:your_password@localhost:3306/school_management?schema=public"
```

**Examples:**

अगर MySQL का password नहीं है:
```env
DATABASE_URL="mysql://root@localhost:3306/school_management?schema=public"
```

अगर password है:
```env
DATABASE_URL="mysql://root:mypassword@localhost:3306/school_management?schema=public"
```

### Step 3: Generate JWT Secret

**PowerShell में:**
```powershell
# Generate random secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**या online tool use करें:**
- https://generate-secret.vercel.app/32

**या manually एक strong string लिखें:**
- Minimum 32 characters
- Random letters, numbers, symbols

### Step 4: Update JWT Secret

`.env` file में:
```env
JWT_SECRET="your-generated-secret-key-here-minimum-32-characters-long"
```

## 📝 Complete .env File Content

`.env` file में ये content paste करें:

```env
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/school_management?schema=public"

# JWT Authentication
JWT_SECRET="change-this-to-a-strong-random-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-strong-random-secret-key"

# Application Environment
NODE_ENV="development"

# Server Configuration
PORT=3000
HOSTNAME="localhost"

# API Configuration
API_URL="http://localhost:3000/api"

# Logging
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# Session Configuration
SESSION_SECRET="change-this-to-a-strong-random-secret-key"
```

## ✅ Verification

### Check if .env file exists:
```powershell
cd d:\school
Test-Path .env
```

### View .env file (first few lines):
```powershell
Get-Content .env -Head 5
```

## 🔧 Common Database URLs

### Local MySQL (XAMPP/WAMP):
```env
DATABASE_URL="mysql://root@localhost:3306/school_management?schema=public"
```

### Local MySQL (with password):
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/school_management?schema=public"
```

### Remote MySQL:
```env
DATABASE_URL="mysql://username:password@your-host.com:3306/school_management?schema=public"
```

## 🔒 Security Notes

1. **Never commit .env file** - यह already `.gitignore` में है
2. **Use strong secrets** - Minimum 32 characters
3. **Different secrets for production** - Development और production में अलग secrets use करें

## 🐛 Troubleshooting

### Error: Cannot find .env file
- Check file name is exactly `.env` (not `.env.txt`)
- Verify file is in project root (`d:\school`)
- Check file is not hidden

### Error: DATABASE_URL not found
- Restart development server after creating .env
- Check syntax in .env file (no spaces around `=`)
- Verify file encoding is UTF-8

### Error: Invalid database URL
- Check MySQL is running
- Verify database name is correct
- Test connection manually

## 📋 Quick Checklist

- [ ] `.env` file created in project root
- [ ] `DATABASE_URL` updated with correct credentials
- [ ] `JWT_SECRET` set to strong random string (32+ chars)
- [ ] `NEXTAUTH_SECRET` set to strong random string
- [ ] File saved and development server restarted

## 🎯 Next Steps

After creating `.env` file:

1. **Test database connection:**
   ```bash
   npx prisma db push
   ```

2. **Seed database:**
   ```bash
   npm run db:seed
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 📞 Need Help?

- Check `ENV_SETUP.md` for detailed guide
- Verify database is running
- Check MySQL credentials
- Restart development server after changes

