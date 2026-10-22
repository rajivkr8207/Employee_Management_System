import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Config from '../../config/Config.js';
import { ROLE_VALUES, ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9]+$/, 'Username can only contain lowercase letters and numbers'],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: function requiredPassword() {
        return this.provider === 'local';
      },
      minlength: 6,
      select: false,
      default: null,
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: undefined,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.MANAGER,
      index: true,
    },

    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      index: true,
    },
    googleId: {
      type: String,
      trim: true,
      default: null,
    },
    otp: {
      type: String,
      select: false,
      default: null,
    },
    otpExpire: {
      type: Date,
      select: false,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    refreshTokenVersion: {
      type: Number,
      select: false,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (document, result) => {
        delete result.password;
        delete result.otp;
        delete result.otpExpire;
        delete result.refreshTokenHash;
        delete result.refreshTokenVersion;
        return result;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  return;
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!password || !this.password) {
    return false;
  }
  return bcrypt.compare(password, this.password);
};

userSchema.methods.hashToken = function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

userSchema.methods.setRefreshTokenHash = function setRefreshTokenHash(token) {
  if (!token) {
    return null;
  }

  this.refreshTokenHash = this.hashToken(token);
  return this.refreshTokenHash;
};

userSchema.methods.compareRefreshToken = function compareRefreshToken(token) {
  if (!token || !this.refreshTokenHash) return false;
  const incomingHash = Buffer.from(this.hashToken(token), 'hex');
  const storedHash = Buffer.from(this.refreshTokenHash, 'hex');
  return (
    incomingHash.length === storedHash.length && crypto.timingSafeEqual(incomingHash, storedHash)
  );
};

userSchema.methods.generateAccessToken = function generateAccessToken() {
  return jwt.sign(
    {
      id: this._id.toString(),
      role: this.role,
      email: this.email,
      provider: this.provider,
    },
    Config.jwt_access_secret,
    {
      expiresIn: Config.jwt_access_expires_in,
    },
  );
};

userSchema.methods.generateRefreshToken = function generateRefreshToken() {
  return jwt.sign(
    {
      id: this._id.toString(),
      version: this.refreshTokenVersion || 0,
      provider: this.provider,
    },
    Config.jwt_refresh_secret,
    {
      expiresIn: Config.jwt_refresh_expires_in,
    },
  );
};

const User = mongoose.model('User', userSchema);

export default User;
