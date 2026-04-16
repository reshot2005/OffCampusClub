
/**
 * Strict validation for Indian mobile numbers
 * 1. Exactly 10 digits
 * 2. Starts with 6, 7, 8, or 9
 * 3. Not all same digits (e.g., 9999999999)
 * 4. Not a common dummy sequence
 */
export function isLegitIndianMobile(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  // Remove all non-digits
  const clean = phone.replace(/\D/g, "");
  
  // Must be exactly 10 digits
  if (clean.length !== 10) return false;
  
  // Must start with 6, 7, 8, or 9 (Standard Indian mobile prefix)
  if (!/^[6-9]/.test(clean)) return false;
  
  // Must not be a single repeating digit
  if (/^(\d)\1{9}$/.test(clean)) return false;
  
  // Common dummy sequences to reject
  const dummies = [
    "1234567890", 
    "0123456789", 
    "9876543210", 
    "1122334455", 
    "1231231231",
    "6789678967"
  ];
  if (dummies.includes(clean)) return false;
  
  return true;
}
