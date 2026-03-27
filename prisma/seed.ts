import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: {
      name: "super_admin",
      displayName: "Super Admin",
      description: "Full system access",
      permissions: ["super_admin:all"],
      isSystem: true,
    },
  })

  const schoolAdminRole = await prisma.role.upsert({
    where: { name: "school_admin" },
    update: {},
    create: {
      name: "school_admin",
      displayName: "School Admin",
      description: "School administrator",
      permissions: [],
      isSystem: true,
    },
  })

  const teacherRole = await prisma.role.upsert({
    where: { name: "teacher" },
    update: {},
    create: {
      name: "teacher",
      displayName: "Teacher",
      description: "Teacher role",
      permissions: [],
      isSystem: true,
    },
  })

  const studentRole = await prisma.role.upsert({
    where: { name: "student" },
    update: {},
    create: {
      name: "student",
      displayName: "Student",
      description: "Student role",
      permissions: [],
      isSystem: true,
    },
  })

  // Create super admin user (schoolId is null for super admin)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      email: "admin@school.com",
      schoolId: null,
    },
  })

  const hashedPassword = await hashPassword("admin123")
  
  const superAdmin = existingSuperAdmin 
    ? await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          password: hashedPassword,
          roleId: superAdminRole.id,
          isActive: true,
          emailVerified: true,
        },
      })
    : await prisma.user.create({
        data: {
          email: "admin@school.com",
          password: hashedPassword,
          firstName: "Super",
          lastName: "Admin",
          roleId: superAdminRole.id,
          isActive: true,
          emailVerified: true,
        },
      })

  // Create a sample school
  const school = await prisma.school.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo-school",
      email: "info@demoschool.com",
      phone: "+1234567890",
      address: "123 Education Street",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
      status: "active",
      subscriptionPlan: "premium",
      maxUsers: 1000,
      maxStudents: 10000,
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      accentColor: "#10b981",
      defaultLanguage: "en",
      supportedLanguages: ["en", "es", "fr", "de", "hi", "ar"],
    },
  })

  // Create school admin
  const existingSchoolAdmin = await prisma.user.findFirst({
    where: {
      email: "admin@demoschool.com",
      schoolId: school.id,
    },
  })

  const schoolAdminHashedPassword = await hashPassword("admin123")
  
  const schoolAdmin = existingSchoolAdmin
    ? await prisma.user.update({
        where: { id: existingSchoolAdmin.id },
        data: {
          password: schoolAdminHashedPassword,
          roleId: schoolAdminRole.id,
          isActive: true,
          emailVerified: true,
        },
      })
    : await prisma.user.create({
        data: {
          email: "admin@demoschool.com",
          password: schoolAdminHashedPassword,
          firstName: "School",
          lastName: "Admin",
          roleId: schoolAdminRole.id,
          schoolId: school.id,
          isActive: true,
          emailVerified: true,
        },
      })

  // Create a class
  const class1 = await prisma.class.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "Grade 1",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "Grade 1",
      level: 1,
      capacity: 40,
      status: "active",
    },
  })

  // Create a section
  const sectionA = await prisma.section.upsert({
    where: {
      classId_name: {
        classId: class1.id,
        name: "A",
      },
    },
    update: {},
    create: {
      classId: class1.id,
      name: "A",
      capacity: 40,
      status: "active",
    },
  })

  console.log("Seeding completed!")
  console.log("Super Admin:", superAdmin.email, "Password: admin123")
  console.log("School Admin:", schoolAdmin.email, "Password: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

