import jwt, { type Secret, type SignOptions } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const JWT_SECRET = (process.env.JWT_SECRET || "your-secret-key") as string
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as string

export interface JWTPayload {
  userId: string
  email: string
  roleId: string
  schoolId?: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  const secret: Secret = JWT_SECRET
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  // Try to find user by email (could be super admin with null schoolId or regular user)
  // First try with schoolId_email compound key, then try with just email for super admin
  let user = await prisma.user.findFirst({
    where: { 
      email,
      isActive: true,
    },
    include: {
      role: true,
      school: true,
    },
  })

  // If not found, try to find super admin (schoolId is null)
  if (!user) {
    user = await prisma.user.findFirst({
      where: {
        email,
        schoolId: null,
        isActive: true,
      },
      include: {
        role: true,
        school: true,
      },
    })
  }

  if (!user || !user.isActive) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return null
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
    schoolId: user.schoolId || undefined,
    role: user.role.name,
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleId: user.roleId,
      schoolId: user.schoolId,
      language: user.language,
      avatar: user.avatar,
    },
    token,
  }
}

