export function extractNumber(value: string | number): number {
    if (typeof value === 'number') {
        return value;
    }

    // Remove non-number characters (excluding '.')
    const sanitizedValue = value.replace(/[^\d.]/g, '');

    // Convert to number
    const result = parseFloat(sanitizedValue);

    // Return the result if it's a valid number, otherwise return 0
    return !isNaN(result) ? result : 0;
}
