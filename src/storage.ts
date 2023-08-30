// 1. GCS file interactions
// 2. Local file interactions

import { Storage } from '@google-cloud/storage';
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage();
const rawVideoBucketName = 'clw-raw-videos';
const processedVideoBucketName = 'clw-processed-videos';

const localRawVideoPath = './raw-videos';
const localProcessedVideoPath = './processed-videos';

/**
 * Creates the local directory for raw and processed videos;
 */

export function setupDirectories() {
  ensureDirectoryExists(localRawVideoPath);
  ensureDirectoryExists(localProcessedVideoPath);
};


/**
 * @param rawVideoName: string - the name of the raw video file {@link localRawVideoPath}.
 * @param processedVideoName - the name of the processed video file {@link localProcessedVideoPath}.
 * @returns Promise<void> - a promise that resolves when the video has been processed.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions('-vf', 'scale=-1:360') // 360p
      .on("end", function () {
        console.log("Finished processing");
        resolve();
      })
      .on("error", function (err: any) {
        console.log('An error occured' + err.message);
        reject(err);
      })
      .save(`${localProcessedVideoPath}/${processedVideoName}`);
  })
}

/**
 * @param fileName - the name of the file download from the
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @return A promise that resolves when the file has been downloaded.
 */
export async function downloadRawVideo(fileName: string) {
  await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({
      destination: `${localRawVideoPath}/${fileName}`,
    })

  console.log(`
      gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}.
    `);
}

/**
 * @param fileName - the name of the file to upload from the
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName} bucket.
 * @return A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName: string) {
  const bucket = storage.bucket(processedVideoBucketName);
  await storage.bucket(processedVideoBucketName)
    .upload(`${localProcessedVideoPath}/${fileName}`, {
      destination: fileName,
    })
  console.log(`
    ${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.
  `)
  await bucket.file(fileName).makePublic();
}
/** 
 * @param fileName - The name of the file to delete from the 
 * {@link localRawVideoPath} folder.
 * @return A promise that resolves when the file has been deleted.
 */
export async function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export async function deleteProcessedVideo(fileName: string) {
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @param filePath - The path of the file to delete.
 * @return A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete the file at ${filePath}`);
          reject(err);
        } else {
          console.log(`File deleted at ${filePath}`);
          resolve();
        }
      })
    } else {
      console.error(`File does not exist at ${filePath}`);
      resolve();
    }
  })
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check
 * 
 */
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory at ${dirPath}`);
  }
}
