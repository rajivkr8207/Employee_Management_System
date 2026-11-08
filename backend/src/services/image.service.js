import ImageKit, { toFile } from '@imagekit/nodejs';
import Config from '../config/config.js';

const client = new ImageKit({
  privateKey: Config.IMAGE_KIT?.trim(),
});

export async function uploadImageToImageKit({
  buffer,
  fileName,
  contentType,
  folderPath = 'employee-faces',
}) {
  const file = await toFile(Buffer.from(buffer), fileName, { type: contentType });
  return client.files.upload({
    file,
    fileName,
    folder: folderPath,
  });
}
