import ImageKit, { toFile } from '@imagekit/nodejs';
import Config from '../config/config.js';

const client = new ImageKit({
  privateKey: Config.IMAGE_KIT,
});

export async function UploadImageToImageKit({ buffer, fileName, folderPath = 'stinch' }) {
  const image = await client.files.upload({
    file: await toFile(buffer),
    fileName: fileName,
    folder: folderPath,
  });
  return image;
}
