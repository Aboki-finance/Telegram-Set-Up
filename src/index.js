// src/index.js
require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const connectDB = require('./config/database');
const { createStage } = require('./scenes');
const { setupCommands } = require('./commands');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

async function startBot() {
  try {
    // Validate environment variables
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN is not defined in environment variables');
    }

    // Connect to database
    await connectDB();
    
    // Initialize bot
    const bot = new Telegraf(token);
    
    // Setup middleware
    bot.use(errorHandler);
    bot.use(rateLimiter);
    bot.use(session());
    
    // Setup scenes
    const stage = createStage();
    bot.use(stage.middleware());
    
    // Setup commands
    setupCommands(bot);
    
    // Start bot
    await bot.launch();
    logger.info('Bot started successfully!');
    
    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      bot.stop(signal);
      process.exit(0);
    };
    
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();