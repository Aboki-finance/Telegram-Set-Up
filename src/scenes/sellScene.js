// src/scenes/sellScene.js
const { BaseScene, Markup } = require('telegraf/scenes');
const { SUPPORTED_CRYPTO, SUPPORTED_FIAT, BANKS } = require('../config/constants');
const { validateCryptoInput, validateAccountNumber } = require('../utils/validation');
const { generateTransactionId } = require('../utils/wallet');
const exchangeService = require('../services/exchangeService');
const userService = require('../services/userService');
const User = require('../models/user');

const sellScene = new BaseScene("sell");

sellScene.enter(async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    
    if (!user?.wallet?.address) {
      ctx.reply(
        "You need to generate a wallet first!",
        Markup.inlineKeyboard([
          [Markup.button.callback("Generate Wallet", "GENERATE_WALLET")],
        ])
      );
      return ctx.scene.leave();
    }

    ctx.scene.session.awaitingAccountNumber = false;
    ctx.replyWithMarkdown(
      "*Enter token amount and symbol*\n\nExample: `10 USDC`"
    );
  } catch (error) {
    ctx.reply("Error loading user data. Please try again.");
  }
});

sellScene.on("text", async (ctx) => {
  // Handle account number input
  if (ctx.scene.session.awaitingAccountNumber) {
    const accountNumber = ctx.message.text.trim();

    if (!validateAccountNumber(accountNumber)) {
      return ctx.replyWithMarkdown("⚠️ Please enter a valid 10-digit account number");
    }

    ctx.scene.session.accountNumber = accountNumber;
    ctx.scene.session.awaitingAccountNumber = false;

    // Mock account name (in production, verify with bank API)
    const mockNames = ["John Doe", "Jane Smith", "Michael Johnson", "Sarah Williams"];
    const accountName = mockNames[Math.floor(Math.random() * mockNames.length)];
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

  // Handle crypto input
  const validation = validateCryptoInput(ctx.message.text);
  
  if (!validation.valid) {
    return ctx.replyWithMarkdown(`⚠️ *${validation.error}*`);
  }

  const { amount, symbol } = validation;
  
  // Store in session
  ctx.scene.session.sellAmount = amount;
  ctx.scene.session.sellToken = symbol;

  // Mock balance check (in production, check real balance)
  const mockBalance = Math.random() * 20;
  ctx.scene.session.tokenBalance = mockBalance;

  if (mockBalance < amount) {
    await ctx.replyWithMarkdown(
      `
⚠️ *Insufficient Balance*

Current balance: ${mockBalance.toFixed(4)} ${symbol}
Requested amount: ${amount} ${symbol}

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

  const fiatAmount = exchangeService.calculateFiatAmount(sellAmount, sellToken, fiatCurrency);
  const rate = exchangeService.getExchangeRate(sellToken, fiatCurrency);

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
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (user.kycStatus !== 'verified') {
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

    await proceedToSellTransaction(ctx);
  } catch (error) {
    ctx.reply("Error checking KYC status. Please try again.");
  }
});

sellScene.action("PROCEED_TO_KYC", async (ctx) => {
  try {
    // Simulate KYC completion (in production, implement proper KYC flow)
    await userService.updateKycStatus(ctx.from.id, 'verified');

    await ctx.replyWithMarkdown(`
✅ *KYC Completed Successfully!*

You can now proceed with your transaction.
    `);

    await proceedToSellTransaction(ctx);
  } catch (error) {
    ctx.reply("Error completing KYC. Please try again.");
  }
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
  ctx.scene.session.awaitingAccountNumber = true;
});

sellScene.action("RE_ENTER_ACCOUNT", async (ctx) => {
  await ctx.replyWithMarkdown("Please enter your account number:");
  ctx.scene.session.awaitingAccountNumber = true;
});

sellScene.action("CONFIRM_ACCOUNT", async (ctx) => {
  try {
    const {
      sellAmount,
      sellToken,
      fiatAmount,
      fiatCurrency,
      bank,
      accountNumber,
      accountName,
    } = ctx.scene.session;

    const txId = generateTransactionId();

    // Add transaction to database
    await userService.addTransaction(ctx.from.id, {
      type: "sell",
      amount: sellAmount,
      currency: sellToken,
      received: parseFloat(fiatAmount),
      receivedCurrency: fiatCurrency,
      bank,
      accountNumber,
      accountName,
      txId,
      status: 'completed'
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
  } catch (error) {
    ctx.reply("Error processing transaction. Please try again.");
  }
});

// Common handlers
sellScene.action("CANCEL_TRANSACTION", (ctx) => {
  ctx.reply("Transaction cancelled.");
  return ctx.scene.leave();
});

sellScene.action("MAIN_MENU", (ctx) => {
  ctx.scene.enter("main_menu");
});

sellScene.action("GENERATE_WALLET", (ctx) => {
  ctx.scene.enter("welcome");
});

module.exports = sellScene;