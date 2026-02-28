import { db as prisma } from '../src/lib/db'

async function main() {
    console.log('Seeding Vehicles for the new Delivery System...')

    // Upsert basic vehicles so we can test the Claim logic
    const vehicles = [
        { name: 'Tropic Van 1', type: 'VAN' },
        { name: 'Tropic Van 2', type: 'VAN' },
        { name: 'Tropic Motor 1', type: 'MOTORCYCLE' },
        { name: 'Tropic Motor 2', type: 'MOTORCYCLE' },
    ]

    for (const v of vehicles) {
        const exists = await prisma.vehicle.findFirst({ where: { name: v.name } })
        if (!exists) {
            await prisma.vehicle.create({
                data: {
                    name: v.name,
                    type: v.type as any,
                    status: 'AVAILABLE'
                }
            })
            console.log(`Created vehicle: ${v.name}`)
        } else {
            console.log(`Vehicle already exists: ${v.name}`)
        }
    }

    console.log('Vehicle seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        // Disconnect handled by db wrapper or not strictly needed
        console.log('Done.')
    })
