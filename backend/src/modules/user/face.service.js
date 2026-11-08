import { uploadImageToImageKit } from '../../services/image.service.js';
import { createFaceEmbedding } from '../../services/faceRecognition.service.js';
import logger from '../../config/logger.js';
import User from './user.model.js';
import crypto from 'node:crypto';
import { ApiError } from '../../utils/ApiError.js';

const uploadFaceImage = async ({ imageBuffer, contentType, folderPath = 'employee-faces' }) => {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
  const upload = await uploadImageToImageKit({
    buffer: imageBuffer,
    fileName: `face-${crypto.randomUUID()}.${extension || 'jpg'}`,
    contentType,
    folderPath,
  });
  if (!upload?.url) throw new ApiError(502, 'ImageKit did not return an image URL');
  return upload.url;
};

export const createFaceProfileData = async ({ imageBuffer, contentType }) => {
  const faceEmbedding = await createFaceEmbedding(imageBuffer);
  let avatar;
  try {
    avatar = await uploadFaceImage({ imageBuffer, contentType });
  } catch (error) {
    logger.error('Failed to upload registration avatar to ImageKit', {
      status: error?.status,
      requestId: error?.headers?.get?.('x-ik-requestid'),
      message: error instanceof Error ? error.message : String(error),
      details: error?.error,
    });
    avatar = `data:${contentType};base64,${imageBuffer.toString('base64')}`;
  }
  return { avatar, faceEmbedding };
};

export const enrollUserFace = async ({ userId, imageBuffer, contentType }) => {
  const faceEmbedding = await createFaceEmbedding(imageBuffer);
  let user = await User.findByIdAndUpdate(
    userId,
    { $set: { faceEmbedding, faceEnrolledAt: new Date() } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');

  let warning;
  let avatar;
  try {
    avatar = await uploadFaceImage({ imageBuffer, contentType });
  } catch (error) {
    logger.error('Failed to upload face enrollment image to ImageKit', {
      status: error?.status,
      requestId: error?.headers?.get?.('x-ik-requestid'),
      code: error?.code,
      message: error instanceof Error ? error.message : String(error),
      details: error?.error,
    });
    avatar = `data:${contentType};base64,${imageBuffer.toString('base64')}`;
    warning =
      'Your face template and avatar are saved in MongoDB. ImageKit upload failed, so the avatar is stored in the account database instead of the ImageKit library.';
  }

  user = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');

  return { user, warning };
};
