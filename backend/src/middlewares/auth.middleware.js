import jwt from 'jsonwebtoken';
import Config from '../config/Config.js';
import User from '../modules/user/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

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
  if (!user.isActive || user.isBlocked || !user.isApproved) {
    throw new ApiError(403, 'Account is not active or approved');
  }

  req.user = { id: user.id, role: user.role, email: user.email };
  return next();
});

export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Administrator access is required'));
  }
  return next();
};
