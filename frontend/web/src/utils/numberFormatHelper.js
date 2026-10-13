/**
 * Number formatting and parsing helpers for input fields with thousand separators.
 * Standardized on Indonesian/European thousand separator (.) for financial and odometer readings.
 */

/**
 * Formats a raw number or numeric string with thousand separators (e.g. 5400000 -> "5.400.000").
 * @param {string|number|null|undefined} val
 * @returns {string}
 */
export function formatThousands(val) {
  if (val === null || val === undefined || val === "") return "";
  const strVal = val.toString();
  // Strip non-digit characters
  const clean = strVal.replace(/\D/g, "");
  if (!clean) return "";
  // Format with dot thousand separator
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Parses a string with thousand separators back into a pure integer or null.
 * @param {string|number|null|undefined} val
 * @returns {number|null}
 */
export function parseThousands(val) {
  if (val === null || val === undefined || val === "") return null;
  const clean = val.toString().replace(/\D/g, "");
  if (!clean) return null;
  const num = parseInt(clean, 10);
  return isNaN(num) ? null : num;
}
