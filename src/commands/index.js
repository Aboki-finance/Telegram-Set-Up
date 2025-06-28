// src/commands/index.js
function setupCommands(bot) {
  bot.command("start", (ctx) => ctx.scene.enter("welcome"));
  bot.command("buy", (ctx) => ctx.scene.enter("buy"));
  bot.command("sell", (ctx) => ctx.scene.enter("sell"));
  bot.command("menu", (ctx) => ctx.scene.enter("main_menu"));
  
  // Action handlers that work globally
  bot.action("WALLET_INFO", async (ctx) => {
    // Delegate to main menu scene handler
    const mainMenuScene = require('../scenes/mainMenuScene');
    return mainMenuScene.action("WALLET_INFO")(ctx);
  });
  
  bot.action("HISTORY", async (ctx) => {
    const mainMenuScene = require('../scenes/mainMenuScene');
    return mainMenuScene.action("HISTORY")(ctx);
  });
  
  bot.action("HELP", async (ctx) => {
    const mainMenuScene = require('../scenes/mainMenuScene');
    return mainMenuScene.action("HELP")(ctx);
  });
}

module.exports = { setupCommands };