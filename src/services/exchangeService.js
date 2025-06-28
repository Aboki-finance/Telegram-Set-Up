// src/services/exchangeService.js
const { SUPPORTED_CRYPTO, SUPPORTED_FIAT, EXCHANGE_RATES } = require('../config/constants');
const logger = require('../utils/logger');

class ExchangeService {
  getExchangeRate(from, to) {
    try {
      if (from === to) return 1;

      // Direct rate
      if (EXCHANGE_RATES[`${from}/${to}`]) {
        return EXCHANGE_RATES[`${from}/${to}`];
      }

      // Inverse rate
      if (EXCHANGE_RATES[`${to}/${from}`]) {
        return 1 / EXCHANGE_RATES[`${to}/${from}`];
      }

      // Convert via USD
      if (SUPPORTED_CRYPTO.includes(from) && SUPPORTED_FIAT.includes(to)) {
        const fromToUsd = EXCHANGE_RATES[`${from}/USD`];
        const usdToTarget = EXCHANGE_RATES[`USD/${to}`];
        if (fromToUsd && usdToTarget) {
          return fromToUsd * usdToTarget;
        }
      }

      if (SUPPORTED_FIAT.includes(from) && SUPPORTED_CRYPTO.includes(to)) {
        const usdFromSource = EXCHANGE_RATES[`USD/${from}`];
        const targetToUsd = EXCHANGE_RATES[`${to}/USD`];
        if (usdFromSource && targetToUsd) {
          return (1 / usdFromSource) * targetToUsd;
        }
      }

      return 0;
    } catch (error) {
      logger.error('Error getting exchange rate:', error);
      return 0;
    }
  }

  calculateCryptoAmount(fiatAmount, fiatCurrency, cryptoCurrency) {
    const rate = this.getExchangeRate(fiatCurrency, cryptoCurrency);
    return rate > 0 ? fiatAmount / rate : 0;
  }

  calculateFiatAmount(cryptoAmount, cryptoCurrency, fiatCurrency) {
    const rate = this.getExchangeRate(cryptoCurrency, fiatCurrency);
    return rate > 0 ? cryptoAmount * rate : 0;
  }

  // In production, this would connect to real exchange APIs
  async updateExchangeRates() {
    try {
      // Implement real API calls here
      logger.info('Exchange rates updated');
    } catch (error) {
      logger.error('Error updating exchange rates:', error);
    }
  }
}

module.exports = new ExchangeService();