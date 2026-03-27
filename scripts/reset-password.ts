import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function resetPassword() {
  const email = "admin@school.com"
  const newPassword = "admin123"
  
  console.log(`Resetting password for ${email}...`)
  
  // Find user
  const user = await prisma.user.findFirst({
    where: {
      email,
      schoolId: null, // Super admin
    },
  })

  if (!user) {
    console.error("User not found!")
    return
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)
  
  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  console.log(`✅ Password reset successful for ${email}`)
  console.log(`New password: ${newPassword}`)
}

resetPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

