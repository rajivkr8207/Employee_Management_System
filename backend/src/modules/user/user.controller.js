import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserById,
  editUserProfile,
  changeUserPassword,
  verifyUserByOTP,
  resendUserOtp,
  createStoreAdminInvitation,
  verifyStoreAdminInvitation,
  registerStoreAdmin,
  listPendingStoreAdmins,
  approveStoreAdmin,
} from './user.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const cookieClearOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { fullName, username, email, password, mobile } = req.body;
  // const image = req.file ? req.file.path : null;
  const user = await registerUser({
    fullName,
    username,
    email,
    password,
    mobile,
  });
  return res.status(201).json(new ApiResponse(201, { user }, 'User registered successfully'));
});

export const VerifyUserByOTPController = asyncHandler(async (req, res) => {
  const email = (req.body.email || req.query.email).trim().toLowerCase();
  const { otp } = req.body;
  const user = await verifyUserByOTP(email, otp);
  return res.status(200).json(new ApiResponse(200, { user }, 'User verified successfully'));
});

export const ResendUserOtpController = asyncHandler(async (req, res) => {
  const email = (req.body.email || req.query.email).trim().toLowerCase();
  const user = await resendUserOtp(email);
  return res.status(200).json(new ApiResponse(200, { user }, 'OTP resent successfully'));
});

export const inviteStoreAdmin = asyncHandler(async (req, res) => {
  const invitation = await createStoreAdminInvitation(req.body.email, req.user.id);
  return res
    .status(201)
    .json(new ApiResponse(201, invitation, 'Store administrator invitation sent'));
});

export const registerInvitedStoreAdmin = asyncHandler(async (req, res) => {
  const user = await registerStoreAdmin(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, { user }, 'Registration submitted for administrator approval'));
});

export const verifyStoreAdminInvitationToken = asyncHandler(async (req, res) => {
  const invitation = await verifyStoreAdminInvitation(req.query.token);
  return res.status(200).json(new ApiResponse(200, invitation, 'Invitation is valid'));
});

export const getPendingStoreAdmins = asyncHandler(async (req, res) => {
  const users = await listPendingStoreAdmins();
  return res.status(200).json(new ApiResponse(200, { users }, 'Pending accounts fetched'));
});

export const approveStoreAdminAccount = asyncHandler(async (req, res) => {
  const user = await approveStoreAdmin(req.params.userId);
  return res.status(200).json(new ApiResponse(200, { user }, 'Store administrator approved'));
});
// ─────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const { user, accessToken, refreshToken } = await loginUser({ identifier, password });
  return res
    .status(200)
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000, // 1 hour
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful'));
});

// ─────────────────────────────────────────────
// POST /api/v1/auth/logout  [Protected]
// ─────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user.id);
  return res
    .clearCookie('accessToken', cookieClearOptions)
    .clearCookie('refreshToken', cookieClearOptions)
    .status(200)
    .json(new ApiResponse(200, {}, 'Logged out successfully'));
});

// ─────────────────────────────────────────────
// POST /api/v1/auth/refresh-token
// ─────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } =
    await refreshAccessToken(incomingRefreshToken);
  return res
    .status(200)
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    })
    .cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        'Access token refreshed',
      ),
    );
});

// ─────────────────────────────────────────────
// GET /api/v1/auth/profile  [Protected]
// ─────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id);
  return res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});
// ─────────────────────────────────────────────
// PATCH /api/v1/auth/profile  [Protected]
// ─────────────────────────────────────────────
export const editProfile = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  const user = await editUserProfile(req.user.id, { fullName, username });

  return res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

// ─────────────────────────────────────────────
// PATCH /api/v1/auth/change-password  [Protected]
// ─────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const result = await changeUserPassword(req.user.id, { oldPassword, newPassword });

  return res.status(200).json(new ApiResponse(200, result, 'Password changed successfully'));
});
