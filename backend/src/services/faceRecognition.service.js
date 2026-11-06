import path from 'node:path';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';
import { Canvas, Image, ImageData, loadImage } from '@napi-rs/canvas';
import * as wasmBackend from '@tensorflow/tfjs-backend-wasm';
import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
import { ApiError } from '../utils/ApiError.js';

const modelPath = fileURLToPath(
  new URL('../../node_modules/@vladmandic/face-api/model/', import.meta.url),
);
const wasmPath = fileURLToPath(
  new URL('../../node_modules/@tensorflow/tfjs-backend-wasm/dist/', import.meta.url),
);
const matchThreshold = 0.6;
let modelLoadPromise;

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const loadModels = () => {
  if (!modelLoadPromise) {
    modelLoadPromise = (async () => {
      wasmBackend.setWasmPaths(pathToFileURL(`${wasmPath}${path.sep}`).href);
      await faceapi.tf.setBackend('wasm');
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
      ]);
    })();
  }
  return modelLoadPromise;
};

export const createFaceEmbedding = async (imageBuffer) => {
  if (!Buffer.isBuffer(imageBuffer) || !imageBuffer.length) {
    throw new ApiError(400, 'A face image is required');
  }
  await loadModels();

  let image;
  try {
    image = await loadImage(imageBuffer);
  } catch {
    throw new ApiError(400, 'The uploaded file is not a valid image');
  }

  const faces = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  if (faces.length === 0) throw new ApiError(400, 'No face was detected. Use a clear, front-facing photo');
  if (faces.length !== 1) throw new ApiError(400, 'The image must contain exactly one face');

  return Array.from(faces[0].descriptor);
};

export const matchesFaceEmbedding = (candidate, enrolled) => {
  if (!Array.isArray(candidate) || !Array.isArray(enrolled) || candidate.length !== 128 || enrolled.length !== 128) {
    return false;
  }
  return faceapi.euclideanDistance(candidate, enrolled) <= matchThreshold;
};
