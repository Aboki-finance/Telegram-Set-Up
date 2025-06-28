// src/services/userService.js
const User = require('../models/user');
const { generateWalletAddress } = require('../utils/wallet');
const logger = require('../utils/logger');

class UserService {
  async findOrCreateUser(telegramId, userData = {}) {
    try {
      let user = await User.findOne({ telegramId });
      
      if (!user) {
        user = new User({
          telegramId,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
        await user.save();
        logger.info(`New user created: ${telegramId}`);
      }
      
      return user;
    } catch (error) {
      logger.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  async generateWallet(telegramId) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) throw new Error('User not found');
      
      if (user.wallet?.address) {
        return user.wallet.address;
      }
      
      const walletAddress = generateWalletAddress();
      user.wallet = {
        address: walletAddress,
        createdAt: new Date()
      };
      
      await user.save();
      logger.info(`Wallet generated for user: ${telegramId}`);
      
      return walletAddress;
    } catch (error) {
      logger.error('Error generating wallet:', error);
      throw error;
    }
  }

  async updateKycStatus(telegramId, status, kycData = {}) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) throw new Error('User not found');
      
      user.kycStatus = status;
      if (Object.keys(kycData).length > 0) {
        user.kycData = { ...user.kycData, ...kycData, submittedAt: new Date() };
      }
      
      await user.save();
      return user;
    } catch (error) {
      logger.error('Error updating KYC status:', error);
      throw error;
    }
  }

  async addTransaction(telegramId, transactionData) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) throw new Error('User not found');
      
      user.transactions.push(transactionData);
      await user.save();
      
      return user;
    } catch (error) {
      logger.error('Error adding transaction:', error);
      throw error;
    }
  }

  async getTransactionHistory(telegramId, limit = 10) {
    try {
      const user = await User.findOne({ telegramId });
      if (!user) return [];
      
      return user.transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting transaction history:', error);
      throw error;
    }
  }
}

module.exports = new UserService();