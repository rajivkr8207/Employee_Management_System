import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ApiError(400, 'Upload a JPEG, PNG, or WebP image'));
      return;
    }
    callback(null, true);
  },
});

const receiveImageWithOptions = (optional) => (req, res, next) => {
  imageUpload.single('image')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (
      optional &&
      (error instanceof multer.MulterError ||
        (error instanceof ApiError && error.message === 'Upload a JPEG, PNG, or WebP image'))
    ) {
      logger.warn('Optional image upload was skipped', {
        path: req.originalUrl,
        message: error.message,
      });
      req.file = undefined;
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message =
        error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : error.message;
      next(new ApiError(status, message));
      return;
    }
    next(error);
  });
};

export const receiveImage = receiveImageWithOptions(false);
export const receiveOptionalImage = receiveImageWithOptions(true);
