import { ServiceRequestsClient } from '@/components/admin/ServiceRequestsClient'
import { verifyToken } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AdminRequestsPage() {
    // Verify admin
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
        redirect('/auth/login')
    }

    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'ADMIN') {
        redirect('/dashboard/user')
    }

    return (
        <div className="pb-10">
            <ServiceRequestsClient />
        </div>
    )
}
