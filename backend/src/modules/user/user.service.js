import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import Config from '../../config/Config.js';
import { MailService } from '../../services/mail.service.js';
import StoreAdminInvitation from './store-admin-invitation.model.js';
import crypto from 'crypto';
import { URL } from 'node:url';
import { ROLES } from '../../constants/roles.js';

export const registerUser = async ({
  fullName,
  username,
  email,
  password,
  mobile,
  provider = 'local',
  googleId = null,
}) => {
  email = email.trim().toLowerCase();
  username = username.trim().toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ email }, { username }, ...(mobile ? [{ mobile }] : [])],
  });
  if (existingUser) {
    throw new ApiError(409, 'User with this email, username, or mobile already exists');
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  const user = await User.create({
    fullName,
    username,
    email,
    password,
    ...(mobile ? { mobile } : {}),
    // avatar: image,
    role: ROLES.EMPLOYEE,
    provider,
    googleId,
    otp,
    otpExpire,
    isVerified: provider !== 'local',
  });
  // if (provider === 'local') {
  //   try {
  //     const mail = await new MailService().SendRegisterMail(email, otp, fullName);
  //     if (!mail) throw new ApiError(502, 'Failed to send verification email');
  //   } catch (error) {
  //     await User.findByIdAndDelete(user._id);
  //     throw error;
  //   }
  // }

  return user;
};

export const createStoreAdminInvitation = async (email, invitedBy) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  if (!Config.frontend_url) {
    throw new ApiError(503, 'Frontend URL is not configured');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const invitation = await StoreAdminInvitation.create({
    email: normalizedEmail,
    tokenHash,
    expiresAt,
    invitedBy,
  });

  const invitationUrl = new URL('/register', Config.frontend_url);
  invitationUrl.searchParams.set('token', token);
  try {
    await new MailService().SendStoreAdminInvitation(normalizedEmail, invitationUrl.toString());
  } catch (error) {
    await StoreAdminInvitation.findByIdAndDelete(invitation._id);
    throw error;
  }

  await StoreAdminInvitation.updateMany(
    { email: normalizedEmail, _id: { $ne: invitation._id }, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  return { email: normalizedEmail, expiresAt };
};

export const verifyStoreAdminInvitation = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invitation = await StoreAdminInvitation.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    usedAt: null,
  }).select('email expiresAt');

  if (!invitation) {
    throw new ApiError(400, 'Invitation link is invalid, expired, or already used');
  }

  return { email: invitation.email, expiresAt: invitation.expiresAt };
};

export const registerStoreAdmin = async ({ token, fullName, username, password, mobile }) => {
  username = username.trim().toLowerCase();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invitation = await StoreAdminInvitation.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    usedAt: null,
  }).select('+tokenHash');

  if (!invitation) {
    throw new ApiError(400, 'Invitation link is invalid, expired, or already used');
  }

  const existingUser = await User.findOne({
    $or: [{ email: invitation.email }, { username }, ...(mobile ? [{ mobile }] : [])],
  });
  if (existingUser) {
    throw new ApiError(409, 'User with this email, username, or mobile already exists');
  }

  const user = await User.create({
    fullName,
    username,
    email: invitation.email,
    password,
    ...(mobile ? { mobile } : {}),
    role: ROLES.STORE_ADMIN,
    provider: 'local',
    isVerified: true,
    isApproved: false,
  });
  const consumedInvitation = await StoreAdminInvitation.updateOne(
    {
      _id: invitation._id,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
  );

  if (consumedInvitation.modifiedCount !== 1) {
    await User.findByIdAndDelete(user._id);
    throw new ApiError(400, 'Invitation link is invalid, expired, or already used');
  }

  return user;
};

export const listPendingStoreAdmins = async () =>
  User.find({ role: ROLES.STORE_ADMIN, isApproved: false }).select(
    'fullName username email mobile createdAt',
  );

export const approveStoreAdmin = async (id) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.STORE_ADMIN, isApproved: false },
    { $set: { isApproved: true } },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new ApiError(404, 'Pending store administrator was not found');
  }
  return user;
};

export const loginUser = async ({ identifier, password }) => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
      { mobile: identifier },
    ],
  }).select('+password +refreshTokenHash +refreshTokenVersion');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.isVerified) {
    throw new ApiError(403, 'Account is not verified. Please verify your email.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account is not active. Please contact support.');
  }
  if (!user.isApproved) {
    throw new ApiError(403, 'Account is awaiting administrator approval.');
  }
  if (user.isBlocked) {
    throw new ApiError(403, 'Account is blocked. Please contact support.');
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password');
  }
  user.refreshTokenVersion += 1;
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.setRefreshTokenHash(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return { user, accessToken, refreshToken };
};

export const logoutUser = async (id) => {
  const user = await User.findById(id).select('+refreshTokenHash +refreshTokenVersion');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.refreshTokenHash = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();
  return;
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, Config.jwt_refresh_secret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenVersion');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.isVerified || !user.isActive || user.isBlocked || !user.isApproved) {
    throw new ApiError(403, 'Account is not active or approved');
  }

  if (
    decoded.version !== user.refreshTokenVersion ||
    !user.compareRefreshToken(incomingRefreshToken)
  ) {
    throw new ApiError(401, 'Refresh token revoked or invalid');
  }

  user.refreshTokenVersion += 1;
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.setRefreshTokenHash(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const editUserProfile = async (id, { fullName, username }) => {
  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (username !== undefined) updates.username = username;
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const changeUserPassword = async (id, { oldPassword, newPassword }) => {
  const user = await User.findById(id).select('+password +refreshTokenHash +refreshTokenVersion');
  if (!user) throw new ApiError(404, 'User not found');

  const isOldPasswordValid = await user.comparePassword(oldPassword);
  if (!isOldPasswordValid) throw new ApiError(401, 'Old password is incorrect');

  user.password = newPassword; // pre-save hook hashes it
  user.refreshTokenHash = null;
  user.refreshTokenVersion += 1;
  await user.save();
  return { message: 'Password changed successfully' };
};

export const verifyUserByOTP = async (email, otp) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
    otp,
  }).select('+otp +otpExpire');
  if (!user || !user.otpExpire || user.otpExpire <= new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }
  user.isVerified = true;
  user.otp = null;
  user.otpExpire = null;
  await user.save();
  return user;
};

export const resendUserOtp = async (email) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select('+otp +otpExpire');
  if (!user) throw new ApiError(404, 'User not found');
  if (user.isVerified) throw new ApiError(409, 'User account is already verified');
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.otp = otp;
  user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  const mail = await new MailService().SendAgainRegisterMail(email, otp, user.fullName);
  if (!mail) {
    throw new ApiError(500, 'Failed to send verification email');
  }
  return user;
};
