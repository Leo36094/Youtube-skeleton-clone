import express from 'express';
import ffmpeg from 'fluent-ffmpeg';

import {
  uploadProcessedVideo,
  downloadRawVideo,
  deleteRawVideo,
  deleteProcessedVideo,
  convertVideo,
  setupDirectories,
} from './storage';

setupDirectories();

const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.post('/process-video', async (req, res) => {
  let data;
  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    data = JSON.parse(message);
    if (!data.name) {
      throw new Error('Invalid message payload received.');
    }
  } catch (error) {
    console.error(error);
    return res.status(400).send('Bad Request: Missing filename.');
  }
  const inputFileName = data.name;
  const outputFileName = `processed-${inputFileName}`
  await downloadRawVideo(inputFileName);
  try {
    await convertVideo(inputFileName, outputFileName);
  } catch (error) {
    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName)
    ]);
    return res.status(500).send('Processing failed.');
  }
  await uploadProcessedVideo(outputFileName);
  await Promise.all([
    deleteRawVideo(inputFileName),
    deleteProcessedVideo(outputFileName)
  ]);
  return res.status(200).send('Processing finished successfully!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
