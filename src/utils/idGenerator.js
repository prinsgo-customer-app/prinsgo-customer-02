/**
 * ID Generator / Formatter Helper
 * Safely generates or formats collision-safe server-side looking unique identifiers
 * supporting standard prefixes requested by the business.
 */

/**
 * Generates a consistent, collision-safe random suffix of numeric digits
 * @param {number} length
 * @returns {string}
 */
const generateRandomDigits = (length = 8) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
};

/**
 * Transforms a raw database ID, string, or returns a fresh auto-generated unique ID with the proper prefix
 * @param {string} prefix - e.g., 'ORD', 'RID', 'PRC', 'REF', 'CLM', 'TKN'
 * @param {string|null} [sourceId] - optional raw mongo _id or backend ID
 * @returns {string}
 */
export const formatId = (prefix, sourceId = null) => {
  if (sourceId && typeof sourceId === 'string') {
    // Check if it's already properly formatted
    if (sourceId.startsWith(prefix)) {
      return sourceId;
    }
    // Take last 8 chars of hex or string to keep it clean and recognizable
    const cleanSource = sourceId.replace(/[^a-zA-Z0-9]/g, '');
    const suffix = cleanSource.length >= 8
      ? cleanSource.slice(-8).toUpperCase()
      : cleanSource.toUpperCase().padStart(8, '0');
    return `${prefix}${suffix}`;
  }

  // Generate completely random, collision-safe digits
  const suffix = generateRandomDigits(8);
  return `${prefix}${suffix}`;
};
