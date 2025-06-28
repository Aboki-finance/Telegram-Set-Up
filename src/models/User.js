// src/models/User.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  cost: Number,
  costCurrency: String,
  received: Number,
  receivedCurrency: String,
  bank: String,
  accountNumber: String,
  accountName: String,
  txId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  username: String,
  firstName: String,
  lastName: String,
  wallet: {
    address: String,
    createdAt: Date
  },
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'verified', 'rejected'],
    default: 'not_started'
  },
  kycData: {
    fullName: String,
    dateOfBirth: Date,
    nationality: String,
    documentType: String,
    documentNumber: String,
    submittedAt: Date
  },
  transactions: [transactionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);