import express from 'express';
import ffmpeg from 'fluent-ffmpeg';

const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.post('/process-video', (req, res) => {
  const inputVideoPath = req.body.inputFilePath;
  const outputFilePath = req.body.outputFilePath;
  if (!inputVideoPath || !outputFilePath) {
    res.status(400).send('Bad Request: Missing file path.');
  }
  ffmpeg(inputVideoPath)
    .outputOptions('-vf', 'scale=-1:360')
    .on('end', () => {
      return res.status(200).send('Video transcoded successfully!')
    })
    .on('error', (err) => {
      console.log('An error occurred: ' + err.message);
      res.status(500).send('Internal Server Error: ' + err);
    })
    .save(outputFilePath);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
