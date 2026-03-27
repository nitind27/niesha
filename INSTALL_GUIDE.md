# Installation Guide

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
npm install
```

अगर `npm install` काम नहीं कर रहा, तो ये try करें:

#### Option 1: Clear cache और फिर install
```bash
npm cache clean --force
npm install
```

#### Option 2: Delete node_modules और package-lock.json
```bash
rm -rf node_modules package-lock.json
npm install
```

Windows PowerShell में:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

#### Option 3: Use yarn (अगर npm काम नहीं करे)
```bash
yarn install
```

#### Option 4: Use specific Node version
```bash
# Node.js 20+ recommended
node --version  # Check version
nvm use 20      # If using nvm
npm install
```

### Step 2: Environment Setup

`.env` file बनाएं:
```env
DATABASE_URL="mysql://user:password@localhost:3306/school_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

### Step 3: Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed
```

### Step 4: Run Development Server

```bash
npm run dev
```

## 🔧 Troubleshooting

### Error: Cannot find module
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: EACCES permission denied
```bash
# Use sudo (Linux/Mac)
sudo npm install

# Or fix permissions
npm config set prefix ~/.npm-global
```

### Error: Python/Visual Studio Build Tools
Windows में C++ build tools install करें:
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/

### Error: Prisma Client not generated
```bash
npx prisma generate
```

### Port already in use
```bash
# Change port in package.json
"dev": "next dev -p 3001"
```

## 📋 System Requirements

- Node.js 20+ 
- npm 9+ या yarn 1.22+
- MySQL 8.0+
- Windows/Linux/Mac OS

## ✅ Verify Installation

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check if dependencies installed
ls node_modules  # Linux/Mac
dir node_modules # Windows
```

## 🆘 Still Having Issues?

1. **Check Node.js version**: `node --version` (should be 20+)
2. **Update npm**: `npm install -g npm@latest`
3. **Clear npm cache**: `npm cache clean --force`
4. **Delete and reinstall**: Remove `node_modules` and `package-lock.json`, then `npm install`
5. **Check internet connection**: Some packages need internet
6. **Use different package manager**: Try `yarn` or `pnpm`

## 📞 Common Solutions

### Windows PowerShell Issues
```powershell
# Use semicolon instead of &&
cd d:\school; npm install
```

### Permission Issues
```bash
# Run as administrator (Windows)
# Or use sudo (Linux/Mac)
```

### Network Issues
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/
npm install
```

