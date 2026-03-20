import { format } from 'date-fns'

export const CATEGORY_INITIALS: Record<string, string> = {
    'Desk': 'DS',
    'Monitor': 'MN',
    'Chair': 'CH',
    'Treadmill': 'TRM',
    'Mouse and Keyboard': 'MK',
    'Accessories': 'AC',
    'Other': 'OT',
    // Indonesian translations if used in DB
    'Meja': 'DS',
    'Kursi': 'CH',
    'Lainnya': 'OT'
}

export function getCategoryInitial(category: string): string {
    return CATEGORY_INITIALS[category] || category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
}

export function generateAssetTag(data: {
    category: string,
    modelName: string,
    sequence: number,
    purchaseDate?: Date | null
}) {
    const prefix = 'TT'
    const cat = getCategoryInitial(data.category)
    
    // Clean model name (e.g. "Workstation Solo" -> "SOLO", "27\" 4K Monitor" -> "27")
    let model = data.modelName
        .toUpperCase()
        .replace(/Workstation/gi, '')
        .replace(/Monitor/gi, '')
        .trim()
        .split(' ')[0]
        .replace(/[^A-Z0-9]/g, '')
    
    if (!model) model = 'UNIT'

    // Format sequence: if > 50, use . separator (e.g. 51 -> 50.1)
    let seqStr = ''
    if (data.sequence <= 50) {
        seqStr = data.sequence.toString().padStart(2, '0')
    } else {
        const base = Math.floor((data.sequence - 1) / 50) * 50
        const rem = (data.sequence - 1) % 50 + 1
        seqStr = `50.${data.sequence - 50}` // Simplification based on user example 50.1
        // Actually user said: if Morethan 50 use "." as a boundry or gap
        // Example: 50.1, 50.2... 
    }

    const dateStr = format(data.purchaseDate || new Date(), 'dd.MM.yyyy')
    
    return `${prefix}${cat}-${model}-${seqStr}-${dateStr}`
}
