/**
 * Format paise (integer) to Indian Rupee (INR) representation
 * Example: 500000 paise -> ₹5,000
 */
export function formatPaiseToRupees(paise, showPaise = false) {
  if (paise === null || paise === undefined) return '₹0';
  const rupees = paise / 100;
  
  if (showPaise) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format large numbers in Indian Lakhs/Crores notation
 */
export function formatIndianCompact(paise) {
  if (!paise) return '₹0';
  const rupees = paise / 100;
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  return formatPaiseToRupees(paise);
}
