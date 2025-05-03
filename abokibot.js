const { Telegraf } = require("telegraf");
const axios = require("axios");
const crypto = require("crypto");

const token = process.env.BOT_TOKEN || "7855516337:AAHFU-LwIwy32WUZqnatreAo6E2JSOP2hS8";
const bot = new Telegraf(token);

bot.start((ctx) => {
    const query = `
Welcome to Aboki,

Your all-in-one crypto bot!

Buy, sell & manage digital assets easily with our secure,

user-friendly interface, all on Telegram! Use the commands below to navigate:

/buy - Buy cryptocurrency  
/sell - Sell cryptocurrency  
/wallet - Generate a new wallet  
/kyc - Complete KYC verification  
`;
    ctx.reply(query);
});

bot.command("buy", (ctx) => {
    ctx.reply("Enter token amount and symbol. EXAMPLE: 10 USDC");
});

bot.command("sell", (ctx) => {
    ctx.reply("Enter token amount and symbol. EXAMPLE: 10 USDC");
});

bot.command("wallet", (ctx) => {
    const randomWallet = "0x" + crypto.randomBytes(20).toString("hex"); // 40-char hex Ethereum-like address
    ctx.reply(`Your wallet has been generated - ${randomWallet}`);
});

bot.command("kyc", (ctx) => {
    ctx.reply("KYC not available. Coming soon.");
});

bot.launch();