// src/scenes/welcomeScene.js
const { Scenes, Markup } = require('telegraf');
const userService = require('../services/userService');

const welcomeScene = new Scenes.BaseScene("welcome");

welcomeScene.enter(async (ctx) => {
  try {
    // Ensure user exists in database
    await userService.findOrCreateUser(ctx.from.id, ctx.from);
    
    const welcomeMessage = `
✨ *Welcome to Aboki* ✨

Your all-in-one crypto solution on Telegram!

Buy, sell & manage digital assets easily with our secure platform.
`;

    await ctx.replyWithMarkdown(
      welcomeMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback("🏦 Generate Wallet", "GENERATE_WALLET")],
      ])
    );
  } catch (error) {
    console.error('Error in welcome scene enter:', error);
    await ctx.reply("Welcome! Something went wrong, but let's continue.");
  }
});

welcomeScene.action("GENERATE_WALLET", async (ctx) => {
  try {
    await ctx.answerCbQuery(); // Always answer callback queries
    
    const walletAddress = await userService.generateWallet(ctx.from.id);

    await ctx.replyWithMarkdown(
      `
✅ *Wallet Generated Successfully!*

Your wallet address: \`${walletAddress}\`

Now you can start trading crypto!
`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Buy Crypto", "BUY"),
          Markup.button.callback("Sell Crypto", "SELL"),
        ],
        [Markup.button.callback("📋 Main Menu", "MAIN_MENU")]
      ])
    );
    
    // Optional: You might want to stay in scene or transition to another scene
    // return ctx.scene.leave();
  } catch (error) {
    console.error('Error generating wallet:', error);
    await ctx.answerCbQuery();
    await ctx.reply("Error generating wallet. Please try again.");
  }
});

welcomeScene.action("BUY", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("🛒 Buy crypto feature coming soon!");
    // Add your buy logic here or transition to buy scene
    // ctx.scene.enter('buy_scene');
  } catch (error) {
    console.error('Error in BUY action:', error);
    await ctx.answerCbQuery();
  }
});

welcomeScene.action("SELL", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("💰 Sell crypto feature coming soon!");
    // Add your sell logic here or transition to sell scene
    // ctx.scene.enter('sell_scene');
  } catch (error) {
    console.error('Error in SELL action:', error);
    await ctx.answerCbQuery();
  }
});

welcomeScene.action("MAIN_MENU", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    ctx.scene.enter("main_menu");
  } catch (error) {
    console.error('Error navigating to main menu:', error);
    await ctx.answerCbQuery();
    await ctx.reply("Error navigating to main menu.");
  }
});

module.exports = welcomeScene;