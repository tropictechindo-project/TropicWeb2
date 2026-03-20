/**
 * Utilities for handling product specifications in a human-readable format
 */

export function formatSpecsToString(specs: any): string {
    if (!specs) return "";
    if (typeof specs === 'string') return specs;
    
    // If it's an object, try to format it nicely
    try {
        const lines: string[] = [];
        
        // Handle common keys first
        if (specs.features && Array.isArray(specs.features)) {
            lines.push(`Features: ${specs.features.join(', ')}`);
        }
        
        const handledKeys = ['features'];
        Object.entries(specs).forEach(([key, value]) => {
            if (handledKeys.includes(key)) return;
            if (typeof value === 'object' && value !== null) {
                lines.push(`${key}: ${JSON.stringify(value)}`);
            } else {
                lines.push(`${key}: ${value}`);
            }
        });
        
        return lines.join('\n');
    } catch (e) {
        return typeof specs === 'object' ? JSON.stringify(specs, null, 2) : String(specs);
    }
}

export function parseSpecsFromString(specsStr: string): any {
    if (!specsStr) return null;
    
    // Attempt to see if it's already JSON (for legacy support or if user types JSON)
    if (specsStr.trim().startsWith('{')) {
        try {
            return JSON.parse(specsStr);
        } catch (e) {
            // Not valid JSON, treat as text
        }
    }
    
    return specsStr; // Just return as string, Prisma JSON column can store this
}
