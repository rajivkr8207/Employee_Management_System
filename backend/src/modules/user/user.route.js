import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  editProfile,
  changePassword,
  VerifyUserByOTPController,
  ResendUserOtpController,
  inviteStoreAdmin,
  verifyStoreAdminInvitationToken,
  registerInvitedStoreAdmin,
  getPendingStoreAdmins,
  approveStoreAdminAccount,
} from './user.controller.js';
import { verifyAdmin, verifyJWT } from '../../middlewares/auth.middleware.js';
import {
  registerValidation,
  loginValidation,
  editProfileValidation,
  changePasswordValidation,
  verifyOtpValidation,
  resendOtpValidation,
  storeAdminInvitationValidation,
  storeAdminApprovalValidation,
  invitedStoreAdminRegisterValidation,
  verifyStoreAdminInvitationValidation,
} from './user.validate.js';

const authRouter = Router();

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register an employee account and send an email OTP
 * @access  Public
 */
authRouter.post('/register', register);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify user email using OTP
 * @access  Public
 */
authRouter.post('/verify-otp', verifyOtpValidation, VerifyUserByOTPController);

authRouter.post('/resend-otp', resendOtpValidation, ResendUserOtpController);
authRouter.get(
  '/store-admin/invitations/verify',
  verifyStoreAdminInvitationValidation,
  verifyStoreAdminInvitationToken,
);
authRouter.post(
  '/store-admin/register',
  invitedStoreAdminRegisterValidation,
  registerInvitedStoreAdmin,
);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and receive tokens
 * @access  Public
 */
authRouter.post('/login', loginValidation, login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
authRouter.post('/refresh-token', refreshToken);

// ─────────────────────────────────────────────
// PROTECTED ROUTES  (requires valid JWT)
// ─────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current user and clear cookies
 * @access  Protected
 */
authRouter.post('/logout', verifyJWT, logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current logged-in user profile
 * @access  Protected
 */
authRouter.get('/profile', verifyJWT, getProfile);

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Edit current user's profile (fullName, username)
 * @access  Protected
 */
authRouter.patch('/profile', verifyJWT, editProfileValidation, editProfile);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change current user's password
 * @access  Protected
 */
authRouter.patch('/change-password', verifyJWT, changePasswordValidation, changePassword);

// ─────────────────────────────────────────────
// ADMIN-ONLY STORE ADMINISTRATION
// ─────────────────────────────────────────────
/**
 * POST /api/v1/auth/store-admin/invitations
 * Body: { "email": "store@example.com" }
 * Sends a one-use registration link that expires after 24 hours.
 */
authRouter.post(
  '/store-admin/invitations',
  verifyJWT,
  verifyAdmin,
  storeAdminInvitationValidation,
  inviteStoreAdmin,
);
authRouter.get('/store-admin/pending', verifyJWT, verifyAdmin, getPendingStoreAdmins);
authRouter.patch(
  '/store-admin/:userId/approve',
  verifyJWT,
  verifyAdmin,
  storeAdminApprovalValidation,
  approveStoreAdminAccount,
);

export default authRouter;
