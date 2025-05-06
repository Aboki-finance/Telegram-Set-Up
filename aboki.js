const { Telegraf, Markup, Scenes, session } = require("telegraf");
const { BaseScene, Stage } = Scenes;
const axios = require("axios");
const crypto = require("crypto");

// Database mock (replace with actual DB in production)
const userDB = {
   users: {},
   addUser(userId, data = {}) {
      if (!this.users[userId]) {
         this.users[userId] = {
            wallet: null,
            kycStatus: false,
            transactions: [],
            ...data,
         };
      }
      return this.users[userId];
   },
   getUser(userId) {
      return this.users[userId] || this.addUser(userId);
   },
   updateUser(userId, data) {
      this.users[userId] = { ...this.getUser(userId), ...data };
      return this.users[userId];
   },
};

// Constants
const SUPPORTED_CRYPTO = ["BTC", "ETH", "USDC", "USDT", "XRP"];
const SUPPORTED_FIAT = ["NGN", "GBP", "USD", "KSH", "GCD"];
const BANKS = ["Zenith", "UBA", "GTBank", "First Bank", "Access", "Opay"];

// Exchange rate mock (replace with actual API calls)
const getExchangeRate = (from, to) => {
   const rates = {
      "BTC/USD": 65000,
      "ETH/USD": 3500,
      "USDC/USD": 1,
      "USDT/USD": 1,
      "XRP/USD": 0.6,
      "USD/NGN": 1500,
      "USD/GBP": 0.79,
      "USD/KSH": 131,
      "USD/GCD": 13.5,
   };

   if (from === to) return 1;

   // Direct rate
   if (rates[`${from}/${to}`]) return rates[`${from}/${to}`];

   // Inverse rate
   if (rates[`${to}/${from}`]) return 1 / rates[`${to}/${from}`];

   // Convert via USD
   if (SUPPORTED_CRYPTO.includes(from) && SUPPORTED_FIAT.includes(to)) {
      return rates[`${from}/USD`] * rates[`USD/${to}`];
   }

   if (SUPPORTED_FIAT.includes(from) && SUPPORTED_CRYPTO.includes(to)) {
      return (1 / rates[`USD/${from}`]) * rates[`${to}/USD`];
   }

   return 0;
};

// Initialize bot
const token =
   process.env.BOT_TOKEN || "7855516337:AAHFU-LwIwy32WUZqnatreAo6E2JSOP2hS8";
const bot = new Telegraf(token);

// Welcome scene
const welcomeScene = new BaseScene("welcome");
welcomeScene.enter((ctx) => {
   const welcomeMessage = `
✨ *Welcome to Aboki* ✨

Your all-in-one crypto solution on Telegram!

Buy, sell & manage digital assets easily with our secure platform.
`;

   ctx.replyWithMarkdown(
      welcomeMessage,
      Markup.inlineKeyboard([
         [Markup.button.callback("🏦 Generate Wallet", "GENERATE_WALLET")],
      ])
   );
});

welcomeScene.action("GENERATE_WALLET", async (ctx) => {
   const userId = ctx.from.id;
   const walletAddress = "0x" + crypto.randomBytes(20).toString("hex");

   userDB.updateUser(userId, { wallet: walletAddress });

   await ctx.replyWithMarkdown(
      `
✅ *Wallet Generated Successfully!*

Your wallet address:
\`${walletAddress}\`

Now you can start trading crypto!
  `,
      Markup.inlineKeyboard([
         [
            Markup.button.callback("Buy Crypto", "BUY"),
            Markup.button.callback("Sell Crypto", "SELL"),
         ],
      ])
   );
   ctx.scene.session = null;

   return ctx.scene.leave();
});

// Buy scene
const buyScene = new BaseScene("buy");
buyScene.enter((ctx) => {
   ctx.replyWithMarkdown(
      "*Enter Buy Amount and Currency*\n\nExample: `25000 NGN`"
   );
});

buyScene.on("text", async (ctx) => {
   const input = ctx.message.text.trim().split(" ");

   if (input.length !== 2) {
      return ctx.replyWithMarkdown(
         "⚠️ *Invalid format*\n\nPlease use format: `AMOUNT CURRENCY`\nExample: `25000 NGN`"
      );
   }

   const amount = parseFloat(input[0]);
   const currency = input[1].toUpperCase();

   if (isNaN(amount) || amount <= 0) {
      return ctx.replyWithMarkdown(
         "⚠️ *Invalid amount*\n\nPlease enter a valid number greater than 0"
      );
   }

   if (!SUPPORTED_FIAT.includes(currency)) {
      return ctx.replyWithMarkdown(
         `⚠️ *Unsupported currency*\n\nWe support: ${SUPPORTED_FIAT.join(", ")}`
      );
   }

   // Store in session
   ctx.scene.session.buyAmount = amount;
   ctx.scene.session.buyCurrency = currency;

   await ctx.replyWithMarkdown(
      "*Select the crypto you want to receive:*",
      Markup.inlineKeyboard(
         SUPPORTED_CRYPTO.map((crypto) => [
            Markup.button.callback(crypto, `BUY_CRYPTO_${crypto}`),
         ])
      )
   );
});

buyScene.action(/BUY_CRYPTO_(.+)/, async (ctx) => {
   const selectedCrypto = ctx.match[1];
   const { buyAmount, buyCurrency } = ctx.scene.session;

   // Calculate rate
   const rate = getExchangeRate(buyCurrency, selectedCrypto);
   const cryptoAmount = buyAmount / rate;

   ctx.scene.session.selectedCrypto = selectedCrypto;
   ctx.scene.session.cryptoAmount = cryptoAmount.toFixed(8);

   await ctx.replyWithMarkdown(
      `
*Confirm Exchange Rate:*

${buyAmount} ${buyCurrency} = ${cryptoAmount.toFixed(8)} ${selectedCrypto}

Rate: 1 ${selectedCrypto} = ${rate.toFixed(2)} ${buyCurrency}
  `,
      Markup.inlineKeyboard([
         [
            Markup.button.callback("✅ Confirm", "CONFIRM_BUY_RATE"),
            Markup.button.callback("❌ Cancel", "CANCEL_TRANSACTION"),
         ],
      ])
   );
});

buyScene.action("CONFIRM_BUY_RATE", async (ctx) => {
   const { buyAmount, buyCurrency } = ctx.scene.session;
   const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);

   ctx.scene.session.accountNumber = accountNumber;
   ctx.scene.session.bank = "Zenith Bank";

   await ctx.replyWithMarkdown(
      `
*Payment Details:*

Bank: Zenith Bank
Account Number: \`${accountNumber}\`
Account Name: Aboki Exchange Ltd
Amount: ${buyAmount} ${buyCurrency}
Reference: ABOKI-${ctx.from.id}

Please make your payment and click "I've Paid" below.
  `,
      Markup.inlineKeyboard([
         [
            Markup.button.callback("💰 I've Paid", "PAYMENT_MADE"),
            Markup.button.callback("❌ Cancel", "CANCEL_TRANSACTION"),
         ],
      ])
   );
});

buyScene.action("PAYMENT_MADE", async (ctx) => {
   const { selectedCrypto, cryptoAmount, buyAmount, buyCurrency } =
      ctx.scene.session;

   // In a real scenario, you'd verify the payment before proceeding

   const txId =
      "TX" + Math.random().toString(36).substring(2, 10).toUpperCase();
   userDB.updateUser(ctx.from.id, {
      transactions: [
         ...userDB.getUser(ctx.from.id).transactions,
         {
            type: "buy",
            amount: cryptoAmount,
            currency: selectedCrypto,
            cost: buyAmount,
            costCurrency: buyCurrency,
            txId,
            timestamp: new Date(),
         },
      ],
   });

   await ctx.replyWithMarkdown(
      `
🎉 *Transaction Successful!* 🎉

${cryptoAmount} ${selectedCrypto} has been added to your wallet!

Transaction ID: \`${txId}\`

Thank you for using Aboki! 🚀
  `,
      Markup.inlineKeyboard([
         [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
   );

   return ctx.scene.leave();
});

// Sell scene
const sellScene = new BaseScene("sell");
sellScene.enter((ctx) => {
   const user = userDB.getUser(ctx.from.id);
   if (!user.wallet) {
      ctx.reply(
         "You need to generate a wallet first!",
         Markup.inlineKeyboard([
            [Markup.button.callback("Generate Wallet", "GENERATE_WALLET")],
         ])
      );
      return ctx.scene.leave();
   }

   ctx.scene.session.awaitingAccountNumber = false; // Initialize this flag
   ctx.replyWithMarkdown(
      "*Enter token amount and symbol*\n\nExample: `10 USDC`"
   );
});

// COMBINED TEXT HANDLER FOR SELL SCENE
sellScene.on("text", async (ctx) => {
   // Check if we're waiting for an account number
   if (ctx.scene.session.awaitingAccountNumber) {
      const accountNumber = ctx.message.text.trim();

      // Basic validation
      if (!/^\d{10}$/.test(accountNumber)) {
         return ctx.replyWithMarkdown(
            "⚠️ Please enter a valid 10-digit account number"
         );
      }

      ctx.scene.session.accountNumber = accountNumber;
      ctx.scene.session.awaitingAccountNumber = false;

      // Mock account name retrieval
      const mockNames = [
         "John Doe",
         "Jane Smith",
         "Michael Johnson",
         "Sarah Williams",
      ];
      const accountName =
         mockNames[Math.floor(Math.random() * mockNames.length)];
      ctx.scene.session.accountName = accountName;

      await ctx.replyWithMarkdown(
         `
*Confirm Account Details:*

Bank: ${ctx.scene.session.bank}
Account Number: ${accountNumber}
Account Name: ${accountName}
`,
         Markup.inlineKeyboard([
            [
               Markup.button.callback("✅ Confirm", "CONFIRM_ACCOUNT"),
               Markup.button.callback("❌ Edit", "RE_ENTER_ACCOUNT"),
            ],
         ])
      );
      return;
   }

   // Handle initial crypto input for selling
   const input = ctx.message.text.trim().split(" ");

   if (input.length !== 2) {
      return ctx.replyWithMarkdown(
         "⚠️ *Invalid format*\n\nPlease use format: `AMOUNT SYMBOL`\nExample: `10 USDC`"
      );
   }

   const amount = parseFloat(input[0]);
   const token = input[1].toUpperCase();

   if (isNaN(amount) || amount <= 0) {
      return ctx.replyWithMarkdown(
         "⚠️ *Invalid amount*\n\nPlease enter a valid number greater than 0"
      );
   }

   if (!SUPPORTED_CRYPTO.includes(token)) {
      return ctx.replyWithMarkdown(
         `⚠️ *Unsupported token*\n\nWe support: ${SUPPORTED_CRYPTO.join(", ")}`
      );
   }

   // Store in session
   ctx.scene.session.sellAmount = amount;
   ctx.scene.session.sellToken = token;

   // Check mock balance (in real app, check actual balance)
   const mockBalance = Math.random() * 20; // Random balance for demo
   ctx.scene.session.tokenBalance = mockBalance;

   if (mockBalance < amount) {
      await ctx.replyWithMarkdown(
         `
⚠️ *Insufficient Balance*

Current balance: ${mockBalance.toFixed(4)} ${token}
Requested amount: ${amount} ${token}

Please fund your wallet first.
    `,
         Markup.inlineKeyboard([
            [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
         ])
      );
      return ctx.scene.leave();
   }

   await ctx.replyWithMarkdown(
      "*Select currency to receive:*",
      Markup.inlineKeyboard(
         SUPPORTED_FIAT.map((fiat) => [
            Markup.button.callback(fiat, `RECEIVE_FIAT_${fiat}`),
         ])
      )
   );
});

sellScene.action(/RECEIVE_FIAT_(.+)/, async (ctx) => {
   const fiatCurrency = ctx.match[1];
   const { sellAmount, sellToken } = ctx.scene.session;

   // Calculate rate
   const rate = getExchangeRate(sellToken, fiatCurrency);
   const fiatAmount = sellAmount * rate;

   ctx.scene.session.fiatCurrency = fiatCurrency;
   ctx.scene.session.fiatAmount = fiatAmount.toFixed(2);

   await ctx.replyWithMarkdown(
      `
*Confirm Exchange Rate:*

${sellAmount} ${sellToken} = ${fiatAmount.toFixed(2)} ${fiatCurrency}

Rate: 1 ${sellToken} = ${rate.toFixed(2)} ${fiatCurrency}
  `,
      Markup.inlineKeyboard([
         [
            Markup.button.callback("✅ Confirm", "CONFIRM_SELL_RATE"),
            Markup.button.callback("❌ Cancel", "CANCEL_TRANSACTION"),
         ],
      ])
   );
});

sellScene.action("CONFIRM_SELL_RATE", async (ctx) => {
   // Check KYC status
   const user = userDB.getUser(ctx.from.id);

   if (!user.kycStatus) {
      await ctx.replyWithMarkdown(
         `
*KYC Required*

To proceed with this transaction, you need to complete KYC verification.
    `,
         Markup.inlineKeyboard([
            [Markup.button.callback("✅ Proceed to KYC", "PROCEED_TO_KYC")],
         ])
      );
      return;
   }

   // If KYC already completed
   await proceedToSellTransaction(ctx);
});

sellScene.action("PROCEED_TO_KYC", async (ctx) => {
   // In a real app, you'd redirect to a KYC process
   // Here we'll just simulate KYC completion
   userDB.updateUser(ctx.from.id, { kycStatus: true });

   await ctx.replyWithMarkdown(`
✅ *KYC Completed Successfully!*

You can now proceed with your transaction.
  `);

   // Continue with transaction
   await proceedToSellTransaction(ctx);
});

async function proceedToSellTransaction(ctx) {
   await ctx.replyWithMarkdown(
      `
*Transaction Relayed* ⏳

Your transaction is now being processed in the background.

Please enter your bank account details:
  `,
      Markup.inlineKeyboard(
         BANKS.map((bank) => [
            Markup.button.callback(bank, `SELECT_BANK_${bank}`),
         ])
      )
   );
}

sellScene.action(/SELECT_BANK_(.+)/, async (ctx) => {
   const bank = ctx.match[1];
   ctx.scene.session.bank = bank;

   await ctx.replyWithMarkdown("Please enter your account number:");
   ctx.scene.session.awaitingAccountNumber = true; // Set the flag to true here
});

sellScene.action("RE_ENTER_ACCOUNT", async (ctx) => {
   await ctx.replyWithMarkdown("Please enter your account number:");
   ctx.scene.session.awaitingAccountNumber = true;
});

sellScene.action("CONFIRM_ACCOUNT", async (ctx) => {
   const {
      sellAmount,
      sellToken,
      fiatAmount,
      fiatCurrency,
      bank,
      accountNumber,
      accountName,
   } = ctx.scene.session;

   // In a real scenario, you'd process the transaction here

   const txId =
      "TX" + Math.random().toString(36).substring(2, 10).toUpperCase();
   userDB.updateUser(ctx.from.id, {
      transactions: [
         ...userDB.getUser(ctx.from.id).transactions,
         {
            type: "sell",
            amount: sellAmount,
            currency: sellToken,
            received: fiatAmount,
            receivedCurrency: fiatCurrency,
            bank,
            accountNumber,
            accountName,
            txId,
            timestamp: new Date(),
         },
      ],
   });

   await ctx.replyWithMarkdown(
      `
🎉 *Transaction Successful!* 🎉

${fiatAmount} ${fiatCurrency} has been sent to your bank account!

Bank: ${bank}
Account: ${accountNumber} (${accountName})
Amount: ${fiatAmount} ${fiatCurrency}

Transaction ID: \`${txId}\`

Thank you for using Aboki! 💰
  `,
      Markup.inlineKeyboard([
         [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
   );

   return ctx.scene.leave();
});

// Main menu scene
const mainMenuScene = new BaseScene("main_menu");
mainMenuScene.enter((ctx) => {
   const user = userDB.getUser(ctx.from.id);
   let walletInfo = "No wallet generated yet";

   if (user.wallet) {
      walletInfo = `Wallet: ${user.wallet.substring(
         0,
         6
      )}...${user.wallet.substring(user.wallet.length - 4)}`;
   }

   ctx.replyWithMarkdown(
      `
*Aboki Crypto Exchange* 🚀

${walletInfo}
KYC Status: ${user.kycStatus ? "✅ Verified" : "❌ Not Verified"}

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
});

// Cancel handler for multiple scenes
const cancelHandler = (ctx) => {
   ctx.reply(
      "Transaction cancelled.",
      Markup.inlineKeyboard([
         [Markup.button.callback("Back to Main Menu", "MAIN_MENU")],
      ])
   );
   return ctx.scene.leave();
};

// Common actions across scenes
buyScene.action("CANCEL_TRANSACTION", cancelHandler);
sellScene.action("CANCEL_TRANSACTION", cancelHandler);

// Common action for main menu across scenes
[buyScene, sellScene, welcomeScene].forEach((scene) => {
   scene.action("MAIN_MENU", (ctx) => {
      ctx.scene.enter("main_menu");
   });
});

// Register scenes
const stage = new Stage([welcomeScene, buyScene, sellScene, mainMenuScene]);
stage.action("BUY", (ctx) => ctx.scene.enter("buy"));
stage.action("SELL", (ctx) => ctx.scene.enter("sell"));
stage.action("MAIN_MENU", (ctx) => ctx.scene.enter("main_menu"));
stage.action("WALLET_INFO", (ctx) => {
   const user = userDB.getUser(ctx.from.id);

   if (!user.wallet) {
      ctx.reply(
         "You need to generate a wallet first!",
         Markup.inlineKeyboard([
            [Markup.button.callback("Generate Wallet", "GENERATE_WALLET")],
         ])
      );
      return;
   }

   // In a real app, you'd fetch real balances
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

   balanceText += `\nWallet Address: \`${user.wallet}\``;

   ctx.replyWithMarkdown(
      balanceText,
      Markup.inlineKeyboard([
         [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
   );
});

stage.action("HISTORY", (ctx) => {
   const user = userDB.getUser(ctx.from.id);
   const transactions = user.transactions || [];

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

   transactions.slice(0, 5).forEach((tx, i) => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      if (tx.type === "buy") {
         historyText += `${i + 1}. BUY: ${tx.amount} ${
            tx.currency
         } (${date})\n`;
      } else {
         historyText += `${i + 1}. SELL: ${tx.amount} ${tx.currency} → ${
            tx.received
         } ${tx.receivedCurrency} (${date})\n`;
      }
   });

   ctx.replyWithMarkdown(
      historyText,
      Markup.inlineKeyboard([
         [Markup.button.callback("🏠 Back to Main Menu", "MAIN_MENU")],
      ])
   );
});

stage.action("HELP", (ctx) => {
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

// Setup middleware
bot.use(session());
bot.use(stage.middleware());

// Command handlers
bot.command("start", (ctx) => ctx.scene.enter("welcome"));
bot.command("buy", (ctx) => ctx.scene.enter("buy"));
bot.command("sell", (ctx) => ctx.scene.enter("sell"));
bot.command("wallet", (ctx) => ctx.action("WALLET_INFO"));
bot.command("history", (ctx) => ctx.action("HISTORY"));
bot.command("help", (ctx) => ctx.action("HELP"));

// Start the bot
bot.launch()
   .then(() => {
      console.log("Bot started successfully!");
   })
   .catch((err) => {
      console.error("Failed to start bot:", err);
   });

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

 