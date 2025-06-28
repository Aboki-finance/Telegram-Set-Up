// src/utils/validation.js
const { SUPPORTED_CRYPTO, SUPPORTED_FIAT } = require('../config/constants');

function validateCryptoInput(input) {
  const parts = input.trim().split(' ');
  
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid format. Use: AMOUNT SYMBOL' };
  }
  
  const amount = parseFloat(parts[0]);
  const symbol = parts[1].toUpperCase();
  
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid amount. Enter a number greater than 0' };
  }
  
  if (!SUPPORTED_CRYPTO.includes(symbol)) {
    return { valid: false, error: `Unsupported crypto. We support: ${SUPPORTED_CRYPTO.join(', ')}` };
  }
  
  return { valid: true, amount, symbol };
}

function validateFiatInput(input) {
  const parts = input.trim().split(' ');
  
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid format. Use: AMOUNT CURRENCY' };
  }
  
  const amount = parseFloat(parts[0]);
  const currency = parts[1].toUpperCase();
  
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid amount. Enter a number greater than 0' };
  }
  
  if (!SUPPORTED_FIAT.includes(currency)) {
    return { valid: false, error: `Unsupported currency. We support: ${SUPPORTED_FIAT.join(', ')}` };
  }
  
  return { valid: true, amount, currency };
}

function validateAccountNumber(accountNumber) {
  return /^\d{10}$/.test(accountNumber.trim());
}

module.exports = {
  validateCryptoInput,
  validateFiatInput,
  validateAccountNumber
};