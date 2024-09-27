// import AWS from 'aws-sdk';

// const s3 = new AWS.S3({ region: 'ca-central-1' });
// const transcribeService = new AWS.TranscribeService({ region: 'ca-central-1' });

// export const handler = async (event) => {
//   const bucketName = 'jobneststore';
//   const languageCode = 'en-US';
//   const audioFile = event.Records[0].s3.object.key;

//   const params = {
//     LanguageCode: languageCode,
//     Media: {
//       MediaFileUri: `s3://${bucketName}/${audioFile}`,
//     },
//     MediaFormat: audioFile.split('.').pop(),
//     TranscriptionJobName: `transcription-job-${Date.now()}`,
//   };

//   try {
//     const data = await transcribeService.startTranscriptionJob(params).promise();
//     const jobId = data.TranscriptionJob.TranscriptionJobName;

//     // Wait for transcription job completion
//     const interval = setInterval(async () => {
//       const status = await transcribeService.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();
//  cons
//       if (status.TranscriptionJob.Status === 'COMPLETED') {
//         clearInterval(interval);

//         // Get transcription results
//         const transcript = await transcribeService.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();
//         const transcriptFile = transcript.TranscriptionJob.Transcript.TranscriptFileUri;

//         // Save transcription results to S3
//         const transcriptParams = {
//           Bucket: bucketName,
//           Key: `transcripts/${audioFile.replace(/\.[^.]+$/, '.txt')}`,
//           Body: transcriptFile,
//         };

//         await s3.putObject(transcriptParams).promise();

//         console.log(`Transcription saved to S3: ${transcriptParams.Key}`);
//       }
//     }, 5000);
//   } catch (error) {
//     console.error(error);
//   }
// };

import AWS from 'aws-sdk';
import fetch from 'node-fetch'; // Make sure to bundle this with your Lambda function

const s3 = new AWS.S3({ region: 'ca-central-1' });
const transcribeService = new AWS.TranscribeService({ region: 'ca-central-1' });

export const handler = async (event) => {
  const bucketName = 'jobneststore';
  const languageCode = 'en-US';
  const audioFile = event.Records[0].s3.object.key;

  const params = {
    LanguageCode: languageCode,
    Media: {
      MediaFileUri: `s3://${bucketName}/${audioFile}`,
    },
    MediaFormat: audioFile.split('.').pop(),
    TranscriptionJobName: `transcription-job-${Date.now()}`,
  };

  try {
    const data = await transcribeService.startTranscriptionJob(params).promise();
    const jobId = data.TranscriptionJob.TranscriptionJobName;

    // Wait for transcription job completion
    const interval = setInterval(async () => {
      const status = await transcribeService.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();

      if (status.TranscriptionJob.Status === 'COMPLETED') {
        clearInterval(interval);

        // Get transcription results
        const transcript = await transcribeService.getTranscriptionJob({ TranscriptionJobName: jobId }).promise();
        const transcriptFile = transcript.TranscriptionJob.Transcript.TranscriptFileUri;

        // Save transcription results to S3
        const transcriptParams = {
          Bucket: bucketName,
          Key: `transcripts/${audioFile.replace(/\.[^.]+$/, '.txt')}`,
          Body: transcriptFile,
        };

        await s3.putObject(transcriptParams).promise();
        console.log(`Transcription saved to S3: ${transcriptParams.Key}`);

        // POST transcription tracking data to your API
        const apiUrl = 'https://main.d3rmfrdfq10qzq.amplifyapp.com/api/transcription-tracking';
        const postData = {
          audioUrl: `s3://${bucketName}/${audioFile}`,
          jobId: jobId,
          fileName: audioFile
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          console.error(`Failed to post transcription tracking: ${response.statusText}`);
        } else {
          console.log('Transcription tracking posted successfully');
        }
      }
    }, 5000);
  } catch (error) {
    console.error(error);
  }
};
