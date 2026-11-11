import jwt from 'jsonwebtoken';
import Config from '../config/config.js';
import { ROLES } from '../constants/roles.js';
import User from '../modules/user/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';

// TTL for cached user profile (10 minutes)
const USER_CACHE_TTL = 600;

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, 'Authentication is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, Config.jwt_access_secret);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  // ── P1.3: Token blacklist check ───────────────────────────────────────────
  const blacklisted = await getCache(`blacklist:token:${token}`);
  if (blacklisted) {
    throw new ApiError(401, 'Token has been revoked. Please log in again.');
  }

  // ── P0.1: Cached user lookup ──────────────────────────────────────────────
  const cacheKey = `auth:user:${decoded.id}`;
  let user = await getCache(cacheKey);

  if (!user) {
    user = await User.findById(decoded.id).lean();
    if (!user) throw new ApiError(401, 'User account was not found');
    await setCache(cacheKey, user, USER_CACHE_TTL);
  }

  if (!user.isActive || user.isBlocked) {
    throw new ApiError(403, 'Account is not active or blocked');
  }

  // Allow pending accounts to access /auth/profile and /auth/logout
  const isProfileOrLogout =
    req.originalUrl?.includes('/auth/profile') || req.originalUrl?.includes('/auth/logout');

  if (!user.isApproved && !isProfileOrLogout) {
    throw new ApiError(403, 'Account is awaiting administrator approval');
  }

  req.user = {
    id: user._id.toString(),
    fullName: user.fullName,
    role: user.role,
    email: user.email,
    isApproved: user.isApproved,
  };

  // Store the raw token for logout invalidation downstream
  req._accessToken = token;

  return next();
});

/** Invalidate a user's cached profile (call after any profile/status change). */
export const invalidateUserCache = (userId) => deleteCache(`auth:user:${userId}`);

export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== ROLES.ADMIN) {
    return next(new ApiError(403, 'Administrator access is required'));
  }
  return next();
};

export const verifyStoreAdmin = (req, res, next) => {
  if (req.user?.role !== ROLES.STORE_ADMIN) {
    return next(new ApiError(403, 'Store administrator access is required'));
  }
  return next();
};

