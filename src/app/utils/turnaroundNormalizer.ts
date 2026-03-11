/**
 * Turnaround Time Normalization Utility
 *
 * Handles flexible input formats for turnaround time and normalizes them to hours.
 * Supports: "24 hours", "24h", "3 days", "3d", "24-48 hours", "3-5 days", etc.
 */

/**
 * Regex patterns for turnaround time parsing
 */
export const TURNAROUND_PATTERNS = {
  // Range patterns (must check first)
  RANGE_HOURS: /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*$/i,
  RANGE_DAYS: /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:days?|d)\s*$/i,
  RANGE_BUSINESS_DAYS: /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:business\s*days?)\s*$/i,

  // Single value patterns
  HOURS: /^(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*$/i,
  DAYS: /^(\d+(?:\.\d+)?)\s*(?:days?|d)\s*$/i,
  BUSINESS_DAYS: /^(\d+(?:\.\d+)?)\s*(?:business\s*days?)\s*$/i,

  // Numeric only (last resort)
  NUMERIC: /^(\d+(?:\.\d+)?)$/,
};

/**
 * Unit conversion constants
 */
export const HOURS_PER_DAY = 24;
export const HOURS_PER_BUSINESS_DAY = 8; // Can be adjusted to 8 if needed
export const MAX_HOURS_THRESHOLD = 168; // 1 week - above this, assume input is days

/**
 * Normalized turnaround time result
 */
export interface NormalizedTurnaround {
  hours: number; // Stored in database (average for ranges)
  minHours?: number; // For ranges
  maxHours?: number; // For ranges
  displayFormat: string; // Human-readable format
  isRange: boolean; // Whether it's a range
  isBusinessDays: boolean; // Whether business days were specified
}

/**
 * Validation helpers
 */
function validateHours(hours: number): void {
  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error(`Invalid hours value: ${hours}. Must be a positive number.`);
  }
  if (hours > 8760) {
    // More than 1 year
    throw new Error(`Hours value too large: ${hours}. Maximum is 8760 (1 year).`);
  }
}

function validateDays(days: number): void {
  if (!Number.isFinite(days) || days < 0) {
    throw new Error(`Invalid days value: ${days}. Must be a positive number.`);
  }
  if (days > 365) {
    // More than 1 year
    throw new Error(`Days value too large: ${days}. Maximum is 365 (1 year).`);
  }
}

function validateRange(min: number, max: number): void {
  if (min >= max) {
    throw new Error(`Invalid range: ${min}-${max}. Minimum must be less than maximum.`);
  }
  if (min < 0 || max < 0) {
    throw new Error(`Invalid range: ${min}-${max}. Values must be positive.`);
  }
}

/**
 * Parse and normalize turnaround time input
 *
 * @param input - Raw turnaround time string or number
 * @returns Normalized turnaround time object
 * @throws Error if input is invalid
 *
 * @example
 * normalizeTurnaround("24-48 hours") // { hours: 36, minHours: 24, maxHours: 48, displayFormat: "24-48h", isRange: true }
 * normalizeTurnaround("3 days") // { hours: 72, displayFormat: "3d", isRange: false }
 * normalizeTurnaround("48") // { hours: 48, displayFormat: "48h", isRange: false }
 */
export function normalizeTurnaround(input: string | number): NormalizedTurnaround {
  // Handle null/undefined
  if (input === null || input === undefined) {
    throw new Error('Turnaround time is required');
  }

  // Convert to string and trim
  const inputStr = String(input).trim();

  if (!inputStr) {
    throw new Error('Turnaround time cannot be empty');
  }

  // Limit input length to prevent DoS
  if (inputStr.length > 100) {
    throw new Error('Turnaround time input too long. Maximum 100 characters.');
  }

  // Try range patterns first (most specific)

  // Range: Hours (e.g., "24-48 hours", "24-48h")
  let match = inputStr.match(TURNAROUND_PATTERNS.RANGE_HOURS);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    validateRange(min, max);
    validateHours(min);
    validateHours(max);
    const avg = Math.round((min + max) / 2);
    return {
      hours: avg,
      minHours: min,
      maxHours: max,
      displayFormat: `${Math.round(min)}-${Math.round(max)}h`,
      isRange: true,
      isBusinessDays: false,
    };
  }

  // Range: Days (e.g., "3-5 days", "3-5d")
  match = inputStr.match(TURNAROUND_PATTERNS.RANGE_DAYS);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    validateRange(min, max);
    validateDays(min);
    validateDays(max);
    const minHours = min * HOURS_PER_DAY;
    const maxHours = max * HOURS_PER_DAY;
    const avg = Math.round((minHours + maxHours) / 2);
    return {
      hours: avg,
      minHours: minHours,
      maxHours: maxHours,
      displayFormat: `${Math.round(min)}-${Math.round(max)}d`,
      isRange: true,
      isBusinessDays: false,
    };
  }

  // Range: Business Days (e.g., "3-5 business days")
  match = inputStr.match(TURNAROUND_PATTERNS.RANGE_BUSINESS_DAYS);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    validateRange(min, max);
    validateDays(min);
    validateDays(max);
    const minHours = min * HOURS_PER_BUSINESS_DAY;
    const maxHours = max * HOURS_PER_BUSINESS_DAY;
    const avg = Math.round((minHours + maxHours) / 2);
    return {
      hours: avg,
      minHours: minHours,
      maxHours: maxHours,
      displayFormat: `${Math.round(min)}-${Math.round(max)} business days`,
      isRange: true,
      isBusinessDays: true,
    };
  }

  // Single value: Hours (e.g., "24 hours", "24h")
  match = inputStr.match(TURNAROUND_PATTERNS.HOURS);
  if (match) {
    const hours = parseFloat(match[1]);
    validateHours(hours);
    return {
      hours: Math.round(hours),
      displayFormat: `${Math.round(hours)}h`,
      isRange: false,
      isBusinessDays: false,
    };
  }

  // Single value: Days (e.g., "3 days", "3d")
  match = inputStr.match(TURNAROUND_PATTERNS.DAYS);
  if (match) {
    const days = parseFloat(match[1]);
    validateDays(days);
    const hours = days * HOURS_PER_DAY;
    return {
      hours: Math.round(hours),
      displayFormat: `${Math.round(days)}d`,
      isRange: false,
      isBusinessDays: false,
    };
  }

  // Single value: Business Days (e.g., "3 business days")
  match = inputStr.match(TURNAROUND_PATTERNS.BUSINESS_DAYS);
  if (match) {
    const days = parseFloat(match[1]);
    validateDays(days);
    const hours = days * HOURS_PER_BUSINESS_DAY;
    return {
      hours: Math.round(hours),
      displayFormat: `${Math.round(days)} business days`,
      isRange: false,
      isBusinessDays: true,
    };
  }

  // Numeric only (e.g., "24", "48", "3")
  match = inputStr.match(TURNAROUND_PATTERNS.NUMERIC);
  if (match) {
    const value = parseFloat(match[1]);

    // Heuristic: if value > 168 hours (1 week), assume it's meant to be days
    if (value > MAX_HOURS_THRESHOLD) {
      const days = value;
      validateDays(days);
      const hours = days * HOURS_PER_DAY;
      return {
        hours: Math.round(hours),
        displayFormat: `${Math.round(days)}d`,
        isRange: false,
        isBusinessDays: false,
      };
    } else {
      // Assume hours for smaller values
      validateHours(value);
      return {
        hours: Math.round(value),
        displayFormat: `${Math.round(value)}h`,
        isRange: false,
        isBusinessDays: false,
      };
    }
  }

  // No pattern matched
  throw new Error(
    `Invalid turnaround time format: "${inputStr}". ` +
      `Expected formats: "24 hours", "24h", "3 days", "3d", "24-48 hours", "3-5 days", or numeric value.`,
  );
}

/**
 * Validate if input is a valid turnaround format (non-throwing version)
 *
 * @param input - Raw turnaround time string or number
 * @returns true if valid, false otherwise
 */
export function isValidTurnaroundInput(input: string | number): boolean {
  try {
    normalizeTurnaround(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse turnaround input without throwing (returns null on error)
 *
 * @param input - Raw turnaround time string or number
 * @returns Normalized turnaround or null if invalid
 */
export function parseTurnaroundInput(input: string | number): NormalizedTurnaround | null {
  try {
    return normalizeTurnaround(input);
  } catch {
    return null;
  }
}
