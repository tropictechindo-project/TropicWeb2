import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * 🔐 Supabase Admin Client
 * This client uses the Service Role Key to bypass RLS and manage users.
 * MUST ONLY BE USED ON THE SERVER.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

/**
 * Creates or updates a user in Supabase Auth and returns the user ID.
 */
export async function syncUserToSupabase(email: string, password?: string, metadata?: any) {
    if (!supabaseServiceKey) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Sync will fail.')
        return null
    }

    // Check if user exists first
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
        console.error('Error listing users:', listError.message)
        return null
    }

    const existingUser = users.users.find(u => u.email === email)

    if (existingUser) {
        // Update existing user
        const updateData: any = { user_metadata: metadata }
        if (password) updateData.password = password

        const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            updateData
        )

        if (updateError) {
            console.error('Error updating user in Supabase:', updateError.message)
            return null
        }

        return updated.user.id
    } else {
        // Create new user
        if (!password) {
            console.error('Password is required for new user creation')
            return null
        }

        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            user_metadata: metadata,
            email_confirm: true // Auto-confirm admin-created users
        })

        if (createError) {
            console.error('Error creating user in Supabase:', createError.message)
            return null
        }

        return created.user.id
    }
}

/**
 * Deletes a user from Supabase Auth.
 */
export async function deleteUserFromSupabase(userId: string) {
    if (!supabaseServiceKey) return false

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
        console.error('Error deleting user from Supabase:', error.message)
        return false
    }
    return true
}
