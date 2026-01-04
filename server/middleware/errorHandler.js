import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.url} - IP: ${req.ip}`);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

// Хелпер для оборачивания асинхронных функций, чтобы не писать try-catch
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
