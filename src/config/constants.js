// src/config/constants.js
module.exports = {
  SUPPORTED_CRYPTO: ["BTC", "ETH", "USDC", "USDT", "XRP"],
  SUPPORTED_FIAT: ["NGN", "GBP", "USD", "KSH", "GCD"],
  BANKS: ["Zenith", "UBA", "GTBank", "First Bank", "Access", "Opay"],
  
  EXCHANGE_RATES: {
    "BTC/USD": 65000,
    "ETH/USD": 3500,
    "USDC/USD": 1,
    "USDT/USD": 1,
    "XRP/USD": 0.6,
    "USD/NGN": 1500,
    "USD/GBP": 0.79,
    "USD/KSH": 131,
    "USD/GCD": 13.5,
  },
  
  SCENE_NAMES: {
    WELCOME: 'welcome',
    BUY: 'buy',
    SELL: 'sell',
    MAIN_MENU: 'main_menu',
    KYC: 'kyc'
  }
};