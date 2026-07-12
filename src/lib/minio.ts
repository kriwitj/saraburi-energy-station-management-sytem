// MinIO client for self-hosted object storage
import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "station-images";
export const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

/**
 * Ensure the bucket exists, creating it if needed
 */
export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
    // Set public read policy
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  }
}

/**
 * Upload a file buffer to MinIO
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  await ensureBucket();

  const objectName = `${Date.now()}-${fileName.replace(/\s/g, "-")}`;

  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  return `${MINIO_PUBLIC_URL}/${BUCKET_NAME}/${objectName}`;
}

/**
 * Delete a file from MinIO by URL
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  try {
    const objectName = url.split(`/${BUCKET_NAME}/`)[1];
    if (objectName) {
      await minioClient.removeObject(BUCKET_NAME, objectName);
    }
  } catch {
    // Ignore errors (file might not exist)
  }
}

export default minioClient;
