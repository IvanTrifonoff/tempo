import winston from 'winston';
import logger from '../config/logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  const status = err.status || 500;
  res.status(status).json({ error: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message });
};
export const asyncHandler = (fn) => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
