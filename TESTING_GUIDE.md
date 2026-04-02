# Testing Guide — Bug Fixes

Base URL: http://localhost:3000
Super Admin: admin@school.com / admin123

---

## Bug 1 — Pricing → Register → Login flow

### What was broken
After registering from the pricing page, the user was redirected to /dashboard
with no school assigned, causing a broken state.

### How to test
1. Open http://localhost:3000/pricing
2. Click "Start Free Trial" on any plan (e.g. Basic)
3. You are redirected to /login?redirect=...
4. Click "Don't have an account? Sign up"
5. Fill in: First Name, Last Name, Email (use a new email), Password (min 6 chars), Confirm Password
6. Click "Create Account"
7. EXPECTED: You are redirected back to /pricing?plan=basic&billing=month&pay=1
8. A school name prompt appears — enter a school name and confirm
9. Payment modal opens — complete payment
10. EXPECTED: Redirected to /dashboard with all modules visible in sidebar
11. Now logout and login again with the same email/password
12. EXPECTED: Login succeeds and dashboard loads with modules

---

## Bug 2 — Admin user detail update not working

### What was broken
The Edit Admin dialog was reading admin.roleId which is undefined.
The actual role ID is nested at admin.role.id. So the role field was blank
and the form failed validation silently.

### How to test
1. Login as super admin: admin@school.com / admin123
2. Go to /admin/super/admins
3. Click the 3-dot menu on any admin row → Edit
4. EXPECTED: Dialog opens with all fields pre-filled including Role dropdown
5. Change the First Name or Phone number
6. Click "Update Admin"
7. EXPECTED: Success toast, table refreshes with updated data
8. Re-open Edit on same admin — EXPECTED: updated values are shown

---

## Bug 3 — Organization edit not working + status not showing

### What was broken
- Edit dialog was not pre-filling status correctly
- Status badge in table was showing but filter was not working properly

### How to test
1. Login as super admin
2. Go to /admin/super/schools
3. Verify status badges show (Active / Suspended / Inactive) in the Status column
4. Use the Status filter dropdown — select "Active" — EXPECTED: only active orgs shown
5. Click 3-dot menu on any org → Edit
6. EXPECTED: Dialog opens with all fields pre-filled:
   - Name, Email, Phone, Address, City, State, Country, Zip, Website
   - Organization Type, Industry
   - Status dropdown (Active/Suspended/Inactive)
   - Subscription Plan, Max Users, Max Members
7. Change Status to "Suspended"
8. Click "Save changes"
9. EXPECTED: Success toast, table refreshes, badge shows "suspended"
10. Re-open Edit — EXPECTED: Status shows "Suspended"

---

## Bug 4 — New admin subscription plan → modules not showing

### What was broken
Two issues:
a) The subscribe flow found the existing global school_admin role and skipped
   updating its permissions, leaving permissions: [] in the DB.
b) The middleware was not merging ROLE_PERMISSIONS defaults, so route access
   checks failed for users with empty DB permissions.

Both are now fixed.

### How to test
1. Go to /pricing, pick a plan that has LIMITED modules (e.g. Basic — only student, class, attendance)
2. Register a new account or login with existing
3. Enter school name, complete payment
4. EXPECTED: Redirected to /dashboard
5. Check sidebar — EXPECTED: Only modules included in the chosen plan are visible
   (e.g. if Basic has student+class+attendance, only those 3 + dashboard + settings show)
6. Try navigating directly to /dashboard/fees — EXPECTED: Redirected to /dashboard (blocked)
7. Now go to /pricing, pick a plan with ALL modules (e.g. Premium/Business)
8. Subscribe (same user, updates existing school)
9. Logout and login again
10. EXPECTED: All modules now visible in sidebar

---

## Bug 5 — Admin login not working (created via super admin panel)

### What was broken
Same root cause as Bug 2: admin.roleId was undefined in the form dialog,
so new admins were created without a valid roleId or the API rejected the request.

### How to test — Create new admin
1. Login as super admin
2. Go to /admin/super/admins → Click "Create Admin"
3. Fill in:
   - First Name: Test
   - Last Name: Admin
   - Email: testadmin@example.com
   - Password: test123
   - Role: select "School Admin" from dropdown (MUST show options now)
   - School: select any school or leave as "No School"
   - Status: Active
4. Click "Create Admin"
5. EXPECTED: Success toast, new admin appears in table
6. Open a new browser tab / incognito
7. Go to /login
8. Login with testadmin@example.com / test123
9. EXPECTED: Login succeeds, redirected to /dashboard with modules visible

### How to test — Edit existing admin
1. In the admins table, click Edit on the newly created admin
2. EXPECTED: Role dropdown shows "School Admin" pre-selected (not blank)
3. Change phone number, click Update Admin
4. EXPECTED: Success, changes saved

---

## Quick API Tests (use browser DevTools or curl)

### Test login API directly
```
POST /api/auth/login
Body: { "email": "admin@school.com", "password": "admin123" }
Expected: 200 with user object
```

### Test admin user update
```
PUT /api/admin/users/{id}
Headers: Cookie: token=...
Body: { "firstName": "Updated", "roleId": "<valid-role-id>" }
Expected: 200 with updated user
```

### Test organization update
```
PUT /api/schools/{id}
Headers: Cookie: token=...
Body: { "status": "suspended" }
Expected: 200 with updated school
```

### Test subscribe
```
POST /api/auth/subscribe
Headers: Cookie: token=...
Body: {
  "planSlug": "basic",
  "billingPeriod": "month",
  "amount": 999,
  "paymentMethod": "upi",
  "schoolName": "Test School"
}
Expected: 200 with redirectTo: "/dashboard"
```

---

## Files Changed in This Fix

- middleware.ts — Added ROLE_PERMISSIONS merge so route access works without plan
- components/admin/admin-form-dialog.tsx — Fixed roleId reading (admin.role.id fallback)
- app/api/auth/subscribe/route.ts — Fixed role permissions update on subscribe
- app/api/schools/[id]/route.ts — Added GET + PUT endpoints for org edit
- components/admin/school-form-dialog.tsx — Added edit mode support
- app/(dashboard)/admin/super/schools/page.tsx — Wired up edit button
