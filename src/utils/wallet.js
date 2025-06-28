// src/utils/wallet.js
const crypto = require('crypto');

function generateWalletAddress() {
  return "0x" + crypto.randomBytes(20).toString("hex");
}

function generateTransactionId() {
  return "TX" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

module.exports = {
  generateWalletAddress,
  generateTransactionId,
  generateAccountNumber
};