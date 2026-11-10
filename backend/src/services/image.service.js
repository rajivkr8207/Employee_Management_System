import ImageKit, { toFile } from '@imagekit/nodejs';
import Config from '../config/config.js';

let client = null;

const getImageKitClient = () => {
  if (!client) {
    const privateKey = Config.IMAGE_KIT;
    if (!privateKey) {
      throw new Error(
        'ImageKit private key is missing. Please set IMAGE_KIT in your environment variables.',
      );
    }
    client = new ImageKit({ privateKey });
  }
  return client;
};

export async function UploadImageToImageKit({ buffer, fileName, folderPath = 'stinch' }) {
  const imageKit = getImageKitClient();
  const image = await imageKit.files.upload({
    file: await toFile(buffer),
    fileName: fileName,
    folder: folderPath,
  });
  return image;
}
