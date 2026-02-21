const { PrismaClient } = require('@prisma/client');

// OLD DATABASE URL (Source)
const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;

// NEW DATABASE URL (Target)
const NEW_DATABASE_URL = process.env.DATABASE_URL;

const oldPrisma = new PrismaClient({
    datasources: {
        db: {
            url: OLD_DATABASE_URL,
        },
    },
});

const newPrisma = new PrismaClient({
    datasources: {
        db: {
            url: NEW_DATABASE_URL,
        },
    },
});

async function migrate() {
    console.log('🚀 Starting Robust JavaScript Migration...');

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
            const data = await oldPrisma[table.name].findMany();

            if (data.length === 0) {
                console.log(`  - No data found in ${table.label}. skipping.`);
                continue;
            }

            console.log(`  - Found ${data.length} records. Transferring...`);

            for (const item of data) {
                try {
                    await newPrisma[table.name].upsert({
                        where: table.name === 'siteSetting' ? { key: item.key } : { id: item.id },
                        update: item,
                        create: item,
                    });
                } catch (itemErr) {
                    console.warn(`    ⚠️ Failed to upsert record in ${table.label} (ID: ${item.id || item.key}): ${itemErr.message}`);
                }
            }
            console.log(`  ✅ Successfully migrated ${table.label}.`);
        } catch (err) {
            console.warn(`  ⚠️ Table ${table.label} could not be fully migrated: ${err.message}`);
        }
    }

    console.log('✨ Migration process finished!');
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
}

migrate();
