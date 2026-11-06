import crypto from 'node:crypto';
import { UploadImageToImageKit } from '../../services/image.service.js';
import { createFaceEmbedding } from '../../services/faceRecognition.service.js';
import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';

export const createFaceProfileData = async ({ imageBuffer, contentType }) => {
  const faceEmbedding = await createFaceEmbedding(imageBuffer);
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
  const upload = await UploadImageToImageKit({
    buffer: imageBuffer,
    fileName: `face-${crypto.randomBytes(12).toString('hex')}.${extension || 'jpg'}`,
    folderPath: 'employee-faces',
  });
  if (!upload?.url) throw new ApiError(502, 'ImageKit did not return an image URL');
  return { avatar: upload.url, faceEmbedding };
};

export const enrollUserFace = async ({ userId, imageBuffer, contentType }) => {
  const faceProfile = await createFaceProfileData({ imageBuffer, contentType });
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        ...faceProfile,
        faceEnrolledAt: new Date(),
      },
    },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};
