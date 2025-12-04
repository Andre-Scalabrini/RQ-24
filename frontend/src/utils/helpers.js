/**
 * Safely converts a value to boolean
 * Handles strings 'true'/'false' and actual boolean values
 * @param {*} value - The value to convert
 * @returns {boolean}
 */
export const toBooleanSafe = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

/**
 * Formats a date to ISO date string (YYYY-MM-DD) for input fields
 * @param {string|Date} date - The date to format
 * @returns {string}
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Checks if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean}
 */
export const isDatePast = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};
