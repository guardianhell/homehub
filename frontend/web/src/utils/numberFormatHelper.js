/**
 * Number formatting and parsing helpers for input fields with thousand separators.
 * Standardized on Indonesian/European thousand separator (.) for financial and odometer readings.
 * Preserves negative numbers and decimals.
 */

/**
 * Formats a raw number or numeric string with thousand separators (e.g. 5400000 -> "5.400.000", -1500.5 -> "-1.500,5").
 * @param {string|number|null|undefined} val
 * @returns {string}
 */
export function formatThousands(val) {
  if (val === null || val === undefined || val === "") return "";
  const strVal = val.toString().trim();
  const isNegative = strVal.startsWith("-");

  // Remove non-digit, non-separator characters
  const clean = strVal.replace(/[^\d.,]/g, "");
  if (!clean) return "";

  let integerPart = clean;
  let decimalPart = "";

  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");

  if (lastComma > -1 && lastComma > lastDot) {
    integerPart = clean.slice(0, lastComma).replace(/[.,]/g, "");
    decimalPart = "," + clean.slice(lastComma + 1).replace(/\D/g, "");
  } else if (lastDot > -1 && clean.split(".").length === 2 && clean.split(".")[1].length <= 2) {
    integerPart = clean.slice(0, lastDot).replace(/[.,]/g, "");
    decimalPart = "," + clean.slice(lastDot + 1).replace(/\D/g, "");
  } else {
    integerPart = clean.replace(/[.,]/g, "");
  }

  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (isNegative ? "-" : "") + formattedInt + decimalPart;
}

/**
 * Parses a string with thousand separators back into a pure number or null.
 * @param {string|number|null|undefined} val
 * @returns {number|null}
 */
export function parseThousands(val) {
  if (val === null || val === undefined || val === "") return null;
  const strVal = val.toString().trim();
  const isNegative = strVal.startsWith("-");

  let clean = strVal.replace(/[^\d.,]/g, "");
  if (!clean) return null;

  const lastComma = clean.lastIndexOf(",");
  if (lastComma > -1) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.split(".").length > 2) {
    clean = clean.replace(/\./g, "");
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return isNegative ? -Math.abs(num) : num;
}
