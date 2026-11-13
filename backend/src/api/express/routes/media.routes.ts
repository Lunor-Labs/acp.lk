import { Router, Request, Response } from 'express';
import { Readable } from 'node:stream';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../../config/env.js';

export const mediaRouter = Router();

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

// Only these folders are public. payslips/, materials/ and pdf/ are NOT here.
const PUBLIC_PREFIXES = ['images/', 'avatars/', 'questions/'];

// Let the acp.lk website show images that come from api.acp.lk
mediaRouter.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

mediaRouter.use(async (req: Request, res: Response) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let key: string;
  try {
    key = decodeURIComponent(req.path.replace(/^\/+/, ''));
  } catch {
    return res.status(400).json({ error: 'Bad path' });
  }

  // Old exam question paths in the DB start with "acp/" (the bucket name)
  if (key.startsWith('acp/')) key = key.slice(4);

  if (!key || key.includes('..') || !PUBLIC_PREFIXES.some((p) => key.startsWith(p))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const object = await s3.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
    );

    res.setHeader('Content-Type', object.ContentType ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    if (object.ContentLength !== undefined) {
      res.setHeader('Content-Length', String(object.ContentLength));
    }
    if (object.ETag) res.setHeader('ETag', object.ETag);

    const stream = object.Body as Readable;
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('Media fetch failed', key, err?.name);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});