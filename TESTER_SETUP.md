# Tester Setup Guide

## Step 1 — Latest code pull karo

Terminal open karo aur project folder me jao, phir ye command chalaao:

```
git pull origin main
```

Agar branch alag hai to:

```
git pull origin <branch-name>
```

---

## Step 2 — Dependencies install karo (agar pehli baar hai)

```
npm install
```

---

## Step 3 — Environment file check karo

Project folder me `.env` file honi chahiye.
Agar nahi hai to developer se maango — bina `.env` ke app nahi chalega.

---

## Step 4 — Database migrate karo (agar pehli baar hai)

```
npx prisma migrate deploy
npx prisma db seed
```

---

## Step 5 — App chalaao

```
npm run dev
```

Browser me kholo: http://localhost:3000

---

## Step 6 — Testing karo

**TESTING_GUIDE.md** file padho — usme saare bugs ke step-by-step test likhe hain.

Super Admin login:
- Email: admin@school.com
- Password: admin123

---

## Important Files

| File | Kya hai |
|------|---------|
| TESTING_GUIDE.md | Saare bugs ke test steps |
| .env | Environment config (developer se lo) |
