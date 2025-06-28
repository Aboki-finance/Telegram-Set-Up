// src/scenes/mainMenuScene.js
const { BaseScene, Markup } = require('telegraf/scenes');
const User = require('../models/user');
const userService = require('../services/userService');

const mainMenuScene = new BaseScene("main_menu");

mainMenuScene.enter(async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    
    if (!user) {
      return ctx.scene.enter("welcome");
    }

    let walletInfo = "No wallet generated yet";
    if (user.wallet?.address) {
      const addr = user.wallet.address;
      walletInfo = `Wallet: ${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }

    const kycStatusText = {
      'not_started': '❌ Not Started',
      'pending': '⏳ Pending',
      'verified': '✅ Verified',
      'rejected': '❌ Rejected'
    };

    ctx.replyWithMarkdown(
      `
*Aboki Crypto Exchange* 🚀

${walletInfo}
KYC Status: ${kycStatusText[user.kycStatus] || '❌ Unknown'}

What would you like to do?
      `,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("Buy Crypto", "BUY"),
          Markup.button.callback("Sell Crypto", "SELL"),
        ],
        [
          Markup.button.callback("Wallet Info", "WALLET_INFO"),
          Markup.button.callback("Transaction History", "HISTORY"),
        ],
        [Markup.button.callback("Help & Support", "HELP")],
      ])
    );
  } catch (error) {
    ctx.reply("Error loading menu. Please try again.");
  }
});

mainMenuScene.action("WALLET_INFO", async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user?.wallet?.address) {
      ctx.reply(
        "You need to generate a wallet first!",
        Markup.inlineKeyboard([
          [Markup.button.callback("Generate Wallet", "GENERATE_WALLET")],
        ])
      );
      return;
    }

    // Mock balances (in production, fetch from blockchain/wallet service)
    const mockBalances = {
      BTC: (Math.random() * 0.1).toFixed(8),
      ETH: (Math.random() * 1.5).toFixed(6),
      USDC: (Math.random() * 100).toFixed(2),
      USDT: (Math.random() * 100).toFixed(2),
    };

    let balanceText = "*Your Wallet Balances:*\n\n";
    for (const [coin, balance] of Object.entries(mockBalances)) {
      balanceText += `${coin}: ${balance}\n`;
    }

    balanceText += `\nWallet Address: \`${user.wallet.address}\``;

    ctx.replyWithMarkdown(
      balanceText,
      Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
    );
  } catch (error) {
    ctx.reply("Error loading wallet info. Please try again.");
  }
});

mainMenuScene.action("HISTORY", async (ctx) => {
  try {
    const transactions = await userService.getTransactionHistory(ctx.from.id, 5);

    if (transactions.length === 0) {
      ctx.replyWithMarkdown(
        "*No transactions yet*",
        Markup.inlineKeyboard([
          [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
        ])
      );
      return;
    }

    let historyText = "*Transaction History:*\n\n";

    transactions.forEach((tx, i) => {
      const date = new Date(tx.createdAt).toLocaleDateString();
      const status = tx.status === 'completed' ? '✅' : tx.status === 'pending' ? '⏳' : '❌';
      
      if (tx.type === "buy") {
        historyText += `${i + 1}. ${status} BUY: ${tx.amount} ${tx.currency} (${date})\n`;
      } else {
        historyText += `${i + 1}. ${status} SELL: ${tx.amount} ${tx.currency} → ${tx.received} ${tx.receivedCurrency} (${date})\n`;
      }
    });

    ctx.replyWithMarkdown(
      historyText,
      Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
    );
  } catch (error) {
    ctx.reply("Error loading transaction history. Please try again.");
  }
});

mainMenuScene.action("HELP", (ctx) => {
  ctx.replyWithMarkdownV2(
    `*Need Help?* 🤔

Here are some common commands:
\\- /start \\- Start the bot
\\- /buy \\- Buy cryptocurrency
\\- /sell \\- Sell cryptocurrency
\\- /wallet \\- View wallet information
\\- /history \\- View transaction history

Contact support: @aboki\\_support`,
    Markup.inlineKeyboard([
      [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
    ])
  );
});

mainMenuScene.action("GENERATE_WALLET", (ctx) => {
  ctx.scene.enter("welcome");
});

module.exports = mainMenuScene;