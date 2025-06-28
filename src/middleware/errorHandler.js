// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (ctx, next) => {
  return next().catch((error) => {
    logger.error('Bot error:', error);
    
    // Send user-friendly error message
    ctx.reply('Sorry, something went wrong. Please try again later.');
    
    // Don't re-throw in production to prevent bot crashes
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  });
};

module.exports = { errorHandler };