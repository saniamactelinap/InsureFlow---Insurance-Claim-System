/**
 * Currency utility functions for InsureFlow.
 * Formats all monetary amounts in Indian Rupees (INR, ₹)
 * using the standard Indian numbering system (e.g., ₹50,000, ₹5,00,000).
 */

export const formatINR = (amount, options = {}) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = Number(amount);
  const hasDecimals = num % 1 !== 0;

  const maximumFractionDigits = options.showDecimals !== undefined
    ? (options.showDecimals ? 2 : 0)
    : (hasDecimals ? 2 : 0);

  const minimumFractionDigits = options.minimumFractionDigits !== undefined
    ? options.minimumFractionDigits
    : (hasDecimals ? 2 : 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

export const formatCurrency = formatINR;

export default formatINR;
