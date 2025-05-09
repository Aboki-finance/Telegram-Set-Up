// Main application entry point 
require('dotenv').config(); 
 
const { Telegraf } = require('telegraf'); 
const scenes = require('./scenes'); 
const middleware = require('./middleware'); 
 
const bot = new Telegraf(process.env.BOT_TOKEN); 
 
// Apply middleware 
middleware.forEach(mw =
 
// Register scenes 
bot.use(scenes.middleware()); 
 
bot.start(ctx =
 
bot.launch() 
  .then(() = started')) 
  .catch(err = failed to start:', err)); 
 
// Enable graceful stop 
process.once('SIGINT', () =
process.once('SIGTERM', () =
