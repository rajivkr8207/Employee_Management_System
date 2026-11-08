import jwt from 'jsonwebtoken';
import Config from '../config/config.js';
import { ROLES } from '../constants/roles.js';
import User from '../modules/user/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, 'Authentication is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, Config.jwt_access_secret);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User account was not found');
  if (!user.isActive || user.isBlocked) {
    throw new ApiError(403, 'Account is not active or blocked');
  }

  // Allow pending accounts to access /auth/profile and /auth/logout
  const isProfileOrLogout =
    req.originalUrl?.includes('/auth/profile') ||
    req.originalUrl?.includes('/auth/logout');

  if (!user.isApproved && !isProfileOrLogout) {
    throw new ApiError(403, 'Account is awaiting administrator approval');
  }

  req.user = {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    email: user.email,
    isApproved: user.isApproved,
  };
  return next();
});

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
