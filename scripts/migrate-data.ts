import { PrismaClient } from '@prisma/client'

// REQUIRED: Set your old database connection string here
const OLD_DATABASE_URL = "postgresql://postgres.bamageuraejfbeoirhgz:%40LacunaCoilflames@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

if (!OLD_DATABASE_URL) {
    console.error('❌ OLD_DATABASE_URL is missing.');
    process.exit(1);
}

// New database comes from the standard DATABASE_URL in .env
const newPrisma = new PrismaClient();
const oldPrisma = new PrismaClient({
    datasources: {
        db: {
            url: OLD_DATABASE_URL,
        },
    },
});

async function migrate() {
    console.log('🚀 Starting Comprehensive Automated Migration...');

    try {
        const tables = [
            { name: 'user', label: 'Users' },
            { name: 'product', label: 'Products' },
            { name: 'siteSetting', label: 'Site Settings' },
            { name: 'productUnit', label: 'Product Units' },
            { name: 'rentalPackage', label: 'Rental Packages' },
            { name: 'rentalPackageItem', label: 'Package Items' },
            { name: 'order', label: 'Orders' },
            { name: 'invoice', label: 'Invoices' },
            { name: 'rentalItem', label: 'Rental Items' },
            { name: 'activityLog', label: 'Activity Logs' },
            { name: 'systemNotification', label: 'System Notifications' },
            { name: 'chatGroup', label: 'Chat Groups' },
            { name: 'chatGroupMember', label: 'Chat Group Members' },
            { name: 'groupMessage', label: 'Group Messages' },
            { name: 'workerSchedule', label: 'Worker Schedules' },
            { name: 'workerAttendance', label: 'Worker Attendance' },
            { name: 'inventorySyncLog', label: 'Inventory Sync Logs' },
            { name: 'workerNotification', label: 'Worker Notifications' },
            { name: 'message', label: 'Direct Messages' },
            { name: 'dailyReport', label: 'Daily Reports' },
            { name: 'deliveryChecklistItem', label: 'Delivery Checklist Items' },
            { name: 'notificationDismissal', label: 'Notification Dismissals' },
            { name: 'systemJobLog', label: 'System Job Logs' },
            { name: 'idempotencyKey', label: 'Idempotency Keys' },
            { name: 'jobQueue', label: 'Job Queue' },
        ];

        for (const table of tables) {
            console.log(`📦 Migrating ${table.label}...`);
            try {
                const prismaOld = oldPrisma as any;
                const prismaNew = newPrisma as any;
                const data = await prismaOld[table.name].findMany();

                if (data.length === 0) {
                    console.log(`  - No data found in ${table.label}. skipping.`);
                    continue;
                }

                console.log(`  - Found ${data.length} records. Transferring...`);

                for (const item of data) {
                    await prismaNew[table.name].upsert({
                        where: table.name === 'siteSetting' ? { key: item.key } : { id: item.id },
                        update: item as any,
                        create: item as any,
                    });
                }
                console.log(`  ✅ Successfully migrated ${table.label}.`);
            } catch (err: any) {
                console.warn(`  ⚠️ Could not migrate ${table.label}: ${err.message}`);
            }
        }

        console.log('✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Global migration error:', error);
    } finally {
        await oldPrisma.$disconnect();
        await newPrisma.$disconnect();
    }
}

migrate();
