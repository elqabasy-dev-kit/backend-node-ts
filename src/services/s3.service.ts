/**
 * @file src/services/s3.service.ts
 * @description Service for handling file storage operations using AWS S3. It provides methods for uploading avatars, deleting objects, and generating signed URLs for downloading attachments and avatars. It also includes error handling to convert provider errors into application-specific errors.
 *              Also we have to make it as adapter, so we can easily switch to another provider in the future if needed. and support many s3 storage providers like minio, digitalocean spaces, etc.
 * @author Mahros AL-Qabasy <mahros.dev>
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";
import {
  storageBucket,
  storageClient,
  storageEndpoint,
} from "../config/s3.config";

export interface IStoredAttachment {
  objectKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class StorageService {

}

export const storageService = new StorageService();
