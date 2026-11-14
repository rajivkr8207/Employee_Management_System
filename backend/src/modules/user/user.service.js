import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import Config from '../../config/config.js';
import StoreAdminInvitation from './store-admin-invitation.model.js';
import crypto from 'crypto';
import { URL } from 'node:url';
import { ROLES } from '../../constants/roles.js';
import { createFaceProfileData } from './face.service.js';
import { deleteCache, setCache } from '../../utils/cache.js';

export const registerUser = async (registrationData) => {
  const { token, fullName, username, password, mobile, avatarBuffer, avatarMimeType } =
    registrationData;

  // Direct open self-registration without invitation is disabled
  if (!token) {
    throw new ApiError(
      403,
      'Direct registration is disabled. You must register using an official administrator invitation link, or be onboarded by your store administrator / manager.',
    );
  }

  // If token is provided, complete store administrator onboarding
  return registerStoreAdmin({
    token,
    fullName,
    username,
    password,
    mobile,
    avatarBuffer,
    avatarMimeType,
  });
};

export const createStoreAdminInvitation = async (email, invitedBy) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ApiError(400, 'A valid email address is required');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const frontendBase = Config.frontend_url || 'http://localhost:5173';
  const invitationUrl = new URL('/register', frontendBase);
  invitationUrl.searchParams.set('token', token);
  const invitationLink = invitationUrl.toString();
  const invitation = await StoreAdminInvitation.create({
    email: normalizedEmail,
    tokenHash,
    invitationLink,
    expiresAt,
    invitedBy,
  });

  await StoreAdminInvitation.updateMany(
    {
      email: normalizedEmail,
      _id: { $ne: invitation._id },
      usedAt: null,
      revokedAt: null,
    },
    { $set: { revokedAt: new Date() } },
  );

  return {
    _id: invitation._id,
    email: normalizedEmail,
    createdAt: invitation.createdAt,
    expiresAt,
    invitationLink,
    status: 'active',
  };
};

export const listStoreAdminInvitations = async () => {
  const now = new Date();
  const invitations = await StoreAdminInvitation.find()
    .select('+invitationLink email expiresAt usedAt revokedAt createdAt invitedBy')
    .populate('invitedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

  return invitations.map((invitation) => {
    let status = 'active';
    if (invitation.usedAt) status = 'used';
    else if (invitation.revokedAt) status = 'revoked';
    else if (invitation.expiresAt <= now) status = 'expired';

    return {
      _id: invitation._id,
      email: invitation.email,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      status,
      invitedBy: invitation.invitedBy,
      ...(status === 'active' ? { invitationLink: invitation.invitationLink } : {}),
    };
  });
};

export const verifyStoreAdminInvitation = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invitation = await StoreAdminInvitation.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    usedAt: null,
    revokedAt: null,
  }).select('email expiresAt');

  if (!invitation) {
    throw new ApiError(400, 'Invitation link is invalid, expired, or already used');
  }

  return {
    email: invitation.email,
    expiresAt: invitation.expiresAt,
  };
};

export const registerStoreAdmin = async ({
  token,
  fullName,
  username,
  password,
  mobile,
  avatarBuffer,
  avatarMimeType,
}) => {
  username = username.trim().toLowerCase();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invitation = await StoreAdminInvitation.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    usedAt: null,
    revokedAt: null,
  }).select('+tokenHash email');

  if (!invitation) {
    throw new ApiError(400, 'Invitation link is invalid, expired, or already used');
  }

  const existingUser = await User.findOne({
    $or: [{ email: invitation.email }, { username }, ...(mobile ? [{ mobile }] : [])],
  });
  if (existingUser) {
    throw new ApiError(409, 'User with this email, username, or mobile already exists');
  }

  const faceProfile = avatarBuffer
    ? await createFaceProfileData({ imageBuffer: avatarBuffer, contentType: avatarMimeType })
    : {};
  const user = await User.create({
    fullName,
    username,
    email: invitation.email,
    password,
    ...(mobile ? { mobile } : {}),
    ...faceProfile,
    ...(faceProfile.faceEmbedding ? { faceEnrolledAt: new Date() } : {}),
    role: ROLES.STORE_ADMIN,
    provider: 'local',
    isVerified: true,
    isApproved: false,
    approvalStatus: 'pending',
    isActive: true,
  });

  await StoreAdminInvitation.updateOne({ _id: invitation._id }, { $set: { usedAt: new Date() } });

  return { user };
};

export const listPendingStoreAdmins = async () =>
  User.find({
    role: ROLES.STORE_ADMIN,
    isApproved: false,
    isActive: true,
    $or: [{ approvalStatus: 'pending' }, { approvalStatus: null }],
  }).select('fullName username email mobile approvalStatus createdAt');

export const approveStoreAdmin = async (id) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.STORE_ADMIN, isApproved: false },
    {
      $set: {
        isApproved: true,
        isActive: true,
        approvalStatus: 'approved',
        rejectionReason: null,
      },
    },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new ApiError(404, 'Pending store administrator was not found');
  }

  return { user };
};

export const rejectStoreAdmin = async (id, reason) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.STORE_ADMIN, isApproved: false },
    {
      $set: {
        isApproved: false,
        isActive: false,
        approvalStatus: 'rejected',
        rejectionReason: reason,
      },
    },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new ApiError(404, 'Pending store administrator was not found');
  }
  return { user };
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
    throw new ApiError(403, 'Account is not verified. Please contact an administrator.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account is not active. Please contact support.');
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

export const logoutUser = async (id, accessToken) => {
  const user = await User.findById(id).select('+refreshTokenHash +refreshTokenVersion');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.refreshTokenHash = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  // ── P1.3: Blacklist the access token until its natural expiry ─────────────
  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken);
      const remaining = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
      if (remaining > 0) {
        await setCache(`blacklist:token:${accessToken}`, '1', remaining);
      }
    } catch {
      // Ignore decoding errors — token blacklist is best-effort
    }
  }

  // ── P0.1: Evict the user profile cache immediately ───────────────────────
  await deleteCache(`auth:user:${id}`);
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

export const editUserProfile = async (id, { fullName, username, mobile }) => {
  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (username !== undefined) updates.username = username;
  if (mobile !== undefined) updates.mobile = mobile;
  const user = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!user) throw new ApiError(404, 'User not found');
  // Invalidate cached auth profile after any profile change
  await deleteCache(`auth:user:${id}`);
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
  // Invalidate cached auth profile after password change (forces re-login)
  await deleteCache(`auth:user:${id}`);
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
  if (!email?.trim()) throw new ApiError(400, 'A valid email address is required');
  throw new ApiError(503, 'Email delivery is disabled; OTP cannot be sent.');
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) throw new ApiError(400, 'A valid email address is required');

  throw new ApiError(503, 'Email delivery is disabled; password reset link cannot be sent.');
};

export const resetPasswordWithToken = async (token, newPassword) => {
  if (!token) throw new ApiError(400, 'Reset token is required');
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select(
    '+password +passwordResetToken +passwordResetExpires +refreshTokenHash +refreshTokenVersion',
  );

  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokenHash = null;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  return { message: 'Password has been successfully reset. You can now log in.' };
};
