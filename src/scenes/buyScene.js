// src/scenes/buyScene.js
const { BaseScene, Markup } = require('telegraf/scenes');
const { SUPPORTED_CRYPTO, SUPPORTED_FIAT } = require('../config/constants');
const { validateFiatInput } = require('../utils/validation');
const { generateAccountNumber, generateTransactionId } = require('../utils/wallet');
const exchangeService = require('../services/exchangeService');
const userService = require('../services/userService');

const buyScene = new BaseScene("buy");

buyScene.enter((ctx) => {
  ctx.replyWithMarkdown(
    "*Enter Buy Amount and Currency*\n\nExample: `25000 NGN`"
  );
});

buyScene.on("text", async (ctx) => {
  const validation = validateFiatInput(ctx.message.text);
  
  if (!validation.valid) {
    return ctx.replyWithMarkdown(`⚠️ *${validation.error}*`);
  }

  const { amount, currency } = validation;
  
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
  const cryptoAmount = exchangeService.calculateCryptoAmount(
    buyAmount, 
    buyCurrency, 
    selectedCrypto
  );
  const rate = exchangeService.getExchangeRate(buyCurrency, selectedCrypto);

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
  const accountNumber = generateAccountNumber();

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
  try {
    const { selectedCrypto, cryptoAmount, buyAmount, buyCurrency } = ctx.scene.session;
    const txId = generateTransactionId();

    // Add transaction to database
    await userService.addTransaction(ctx.from.id, {
      type: "buy",
      amount: parseFloat(cryptoAmount),
      currency: selectedCrypto,
      cost: buyAmount,
      costCurrency: buyCurrency,
      txId,
      status: 'completed'
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
  } catch (error) {
    ctx.reply("Error processing transaction. Please try again.");
  }
});

// Common handlers
buyScene.action("CANCEL_TRANSACTION", (ctx) => {
  ctx.reply("Transaction cancelled.");
  return ctx.scene.leave();
});

buyScene.action("MAIN_MENU", (ctx) => {
  ctx.scene.enter("main_menu");
});

module.exports = buyScene;