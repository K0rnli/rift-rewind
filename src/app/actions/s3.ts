'use server';

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.name,
    Body: buffer,
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(params));
  return { success: true };
}

export async function getJsonFileFromS3(filename: string) {
  console.log(process.env.S3_BUCKET_NAME)
  console.log(filename)
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
    }); 
    const response = await s3Client.send(command);
    return JSON.parse(await response.Body?.transformToString() || '{}');
}

export async function listObjectsInS3(prefix: string): Promise<string[]> {
  const objects: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response: ListObjectsV2CommandOutput = await s3Client.send(command);
    
    if (response.Contents) {
      objects.push(...response.Contents.map((obj) => obj.Key || '').filter((key) => key.length > 0));
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}
