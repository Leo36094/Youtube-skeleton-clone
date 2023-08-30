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

export function setupDirectories() {};


/**
 * @param rawVideoName: string - the name of the raw video file {@link localRawVideoPath}.
 * @param processedVideoName - the name of the processed video file {@link localProcessedVideoPath}.
 * @returns Promise<void> - a promise that resolves when the video has been processed.
 */
export function covertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
    .outputOptions('-vf', 'scale=-1:360') // 360p
    .on("end", function () {
      console.log("Finished processing");
      resolve();
    })
    .on("error", function(err: any) {
      console.log('An error occured' + err.message);
      reject(err);
    })
    .save(`${localProcessedVideoPath}/${processedVideoName}`);
  })
}
