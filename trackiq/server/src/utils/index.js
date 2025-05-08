/**
 * Format API response
 * @param {boolean} success - Whether the request was successful
 * @param {*} data - The data to send back
 * @param {string} message - Optional message to include
 * @returns {Object} Formatted response object
 */
exports.formatResponse = (success, data = null, message = '') => {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Catch async errors in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
