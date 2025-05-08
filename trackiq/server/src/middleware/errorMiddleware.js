/**
 * Handle 404 errors - Resource not found
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Custom error handler
 * Provides detailed error information in development
 * Sends safe error messages in production
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Set status code
  res.status(statusCode);
  
  // Send error response
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    // Additional error details for specific cases
    ...(err.errors && { errors: err.errors }),
    ...(err.code && { code: err.code }),
    ...(err.name === 'ValidationError' && { 
      validationErrors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    })
  });
};

module.exports = {
  notFound,
  errorHandler
};
