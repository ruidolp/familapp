/**
 * Quantity Adjustment Utility
 *
 * Handles fraction-based quantity adjustments for kitchen/grocery items
 * Supports: 1/4, 1/2, 3/4, and whole numbers
 */

export type Quantity = string // "1", "1/2", "3/4", "1/4", "2", "3", etc.

/**
 * Fractions in order (ascending)
 */
const FRACTIONS = ['1/4', '1/2', '3/4'] as const

/**
 * Check if a value is a valid fraction
 */
export function isFraction(value: string): boolean {
  return FRACTIONS.includes(value as any)
}

/**
 * Check if a value is a valid whole number
 */
export function isWholeNumber(value: string): boolean {
  const num = parseInt(value, 10)
  return !isNaN(num) && num > 0 && value === String(num)
}

/**
 * Check if a value is a valid quantity
 */
export function isValidQuantity(value: string): boolean {
  return isFraction(value) || isWholeNumber(value)
}

/**
 * Convert a decimal to fraction string if applicable
 * 0.25 -> "1/4", 0.5 -> "1/2", 0.75 -> "3/4"
 */
export function decimalToFraction(decimal: number): string | null {
  if (decimal === 0.25) return '1/4'
  if (decimal === 0.5) return '1/2'
  if (decimal === 0.75) return '3/4'
  return null
}

/**
 * Convert quantity string to decimal number for calculations
 */
export function quantityToDecimal(quantity: string): number {
  if (quantity === '1/4') return 0.25
  if (quantity === '1/2') return 0.5
  if (quantity === '3/4') return 0.75
  return parseInt(quantity, 10) || 1
}

/**
 * Adjust quantity based on direction (up/down)
 *
 * DOWN logic:
 * - 1 → 3/4
 * - 3/4 → 1/2
 * - 1/2 → 1/4
 * - 1/4 → 1/4 (stays)
 * - n > 1 → n-1
 *
 * UP logic:
 * - 1/4 → 1
 * - 1/2 → 1
 * - 3/4 → 1
 * - 1 → 2
 * - 2 → 3
 * - n → n+1
 */
export function adjustQty(current: string, direction: 'up' | 'down'): string {
  if (!isValidQuantity(current)) {
    current = '1' // Default to 1 if invalid
  }

  if (direction === 'down') {
    // Going down
    if (current === '1') return '3/4'
    if (current === '3/4') return '1/2'
    if (current === '1/2') return '1/4'
    if (current === '1/4') return '1/4' // Can't go lower

    // For whole numbers > 1
    const num = parseInt(current, 10)
    if (!isNaN(num) && num > 1) {
      return String(num - 1)
    }
  } else {
    // Going up
    if (current === '1/4') return '1'
    if (current === '1/2') return '1'
    if (current === '3/4') return '1'

    // For whole numbers
    const num = parseInt(current, 10)
    if (!isNaN(num) && num >= 1) {
      return String(num + 1)
    }
  }

  return current
}

/**
 * Format quantity for display
 */
export function formatQuantity(quantity: string): string {
  if (!isValidQuantity(quantity)) return '1'
  return quantity
}
