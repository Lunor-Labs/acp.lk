import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageProvider, UploadResult } from './IStorageProvider.js';
import { env } from '../../config/env.js';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      // Required for path-style endpoints (MinIO, Garage, etc.)
      forcePathStyle: true,
    });
  }

  // ─── Upload ───────────────────────────────────────────────────────────────

  async upload(
    bucket: string,
    path: string,
    file: Buffer,
    mimeType: string,
    options: { upsert?: boolean } = {}
  ): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: file,
        ContentType: mimeType,
      })
    );

    const publicUrl = this.getPublicUrl(bucket, path);
    return { path, publicUrl };
  }

  // ─── Signed URL (download) ────────────────────────────────────────────────

  async getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    return awsGetSignedUrl(this.client, command, { expiresIn });
  }

  // ─── Signed URL (upload) ──────────────────────────────────────────────────

  async createSignedUploadUrl(
    bucket: string,
    path: string
  ): Promise<{ signedUrl: string; token: string; path: string }> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    const signedUrl = await awsGetSignedUrl(this.client, command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      signedUrl,
      token: '',   // S3 presigned URLs carry auth in the URL itself
      path,
    };
  }

  // ─── Public URL ───────────────────────────────────────────────────────────

  getPublicUrl(bucket: string, path: string): string {
    // S3_PUBLIC_URL is the base public URL of your bucket
    // e.g. https://acp.s3.amazonaws.com  or  https://your-garage-domain/acp
    const base = env.S3_PUBLIC_URL.replace(/\/$/, '');
    return `${base}/${path}`;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async delete(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: paths.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}