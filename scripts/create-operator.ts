import { db } from '@/lib/db'
import { hashPassword, generateUsername } from '@/lib/auth/utils'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function createOperatorAccount() {
    const email = 'operator@tropictech.online'
    const password = 'Operator123'
    const fullName = 'TropicTech Operator'

    // Check if already exists
    const existing = await db.user.findFirst({ where: { email } })
    if (existing) {
        console.log(`✅ Operator account already exists: ${email}`)
        return
    }

    // Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    })

    if (authError || !authData.user) {
        console.error('Supabase auth error:', authError?.message)
        // Try sign up instead
        const { data: signupData } = await supabase.auth.signUp({ email, password })
        if (!signupData.user) {
            console.error('Failed to create Supabase user')
            return
        }
        authData.user = signupData.user as any
    }

    const hashedPassword = await hashPassword(password)
    const username = generateUsername(fullName)

    await db.user.create({
        data: {
            id: authData.user!.id,
            email,
            fullName,
            username,
            password: hashedPassword,
            whatsapp: '+6281234567890',
            role: 'OPERATOR',
            isVerified: true,
        }
    })

    console.log(`🚀 Operator account created successfully!`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Role: OPERATOR`)
}

createOperatorAccount()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
