import UserModel from '../modules/user/user.model.js';
import { ROLES } from '../constants/roles.js';
import Config from '../config/config.js';
import logger from '../config/logger.js';

export const bootstrapInitialAdmin = async ({
  email = Config.initial_admin_email,
  username = Config.initial_admin_username,
  password = Config.initial_admin_password,
  fullName = Config.initial_admin_name,
} = {}) => {
  try {
    const adminExists = await UserModel.exists({ role: ROLES.ADMIN });
    if (adminExists) {
      return { created: false, message: 'Admin account already exists in database' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // Check if user with this email or username already exists
    let user = await UserModel.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (user) {
      user.role = ROLES.ADMIN;
      user.isApproved = true;
      user.isVerified = true;
      user.isActive = true;
      user.approvalStatus = 'approved';
      await user.save();
      logger.info(`[BOOTSTRAP] Promoted existing account "${user.email}" to System Admin.`);
      return { created: false, promoted: true, user };
    }

    user = await UserModel.create({
      fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role: ROLES.ADMIN,
      isVerified: true,
      isApproved: true,
      isActive: true,
      approvalStatus: 'approved',
    });

    logger.info(`[BOOTSTRAP] Initial System Admin created successfully: ${normalizedEmail}`);
    return { created: true, user };
  } catch (error) {
    logger.error(`[BOOTSTRAP ERROR] Failed to bootstrap initial admin: ${error.message}`);
    return { created: false, error: error.message };
  }
};
