import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmails = ['tropictechindo@gmail.com', 'Damnbayu@gmail.com']
  const password = 'Car4sale123!'
  const hashedPassword = await bcrypt.hash(password, 10)

  console.log('--- Setting Admin Passwords ---')

  for (const email of adminEmails) {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { 
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true
        }
      })
      console.log(`✅ Updated password and role for: ${email}`)
    } else {
      console.log(`⚠️ User not found: ${email}. Please ensure they are registered first.`)
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
