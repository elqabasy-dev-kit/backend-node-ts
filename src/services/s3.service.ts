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
import { ErrorCode, MyError } from "../types/error.type";

export interface IStoredAttachment {
  objectKey: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class StorageService {
  private toStorageError(action: string, error: unknown): MyError {
    const err = error as {
      message?: string;
      name?: string;
      code?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };

    const providerCode =
      err?.code || err?.Code || err?.name || "UNKNOWN_PROVIDER_ERROR";
    const providerMessage = err?.message || "Unknown storage provider error";
    const httpCode = err?.$metadata?.httpStatusCode;
    const httpSuffix = httpCode ? `, httpStatus=${httpCode}` : "";

    return new MyError({
      code: ErrorCode.STORAGE_ERROR,
      message: `${action} failed (${providerCode}${httpSuffix}): ${providerMessage}. endpoint=${storageEndpoint}, bucket=${storageBucket}`,
    });
  }


  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<IStoredAttachment> {
    if (!userId) {
      throw new MyError({
        code: ErrorCode.INVALID_RESOURCE_ID,
        message: "User ID is required",
      });
    }

    const safeName = this.sanitizeFileName(file.originalname);
    const objectKey = `users/${userId}/avatar/${randomUUID()}-${safeName}`;

    try {
      await storageClient.send(
        new PutObjectCommand({
          Bucket: storageBucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );

      return {
        objectKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw this.toStorageError("Upload avatar", error);
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (!objectKey) {
      return;
    }

    try {
      await storageClient.send(
        new DeleteObjectCommand({
          Bucket: storageBucket,
          Key: objectKey,
        }),
      );
    } catch (error) {
      throw this.toStorageError("Delete attachment", error);
    }
  }

  async createAttachmentDownloadUrl(objectKey: string): Promise<string> {
    try {
      return await getSignedUrl(
        storageClient,
        new GetObjectCommand({
          Bucket: storageBucket,
          Key: objectKey,
        }),
        { expiresIn: 60 * 15 },
      );
    } catch (error) {
      throw this.toStorageError("Create attachment download URL", error);
    }
  }

  async createAvatarDownloadUrl(objectKey: string): Promise<string> {
    try {
      return await getSignedUrl(
        storageClient,
        new GetObjectCommand({
          Bucket: storageBucket,
          Key: objectKey,
        }),
        { expiresIn: 60 * 15 },
      );
    } catch (error) {
      throw this.toStorageError("Create avatar download URL", error);
    }
  }

  private sanitizeFileName(fileName: string): string {
    const baseName = path.basename(fileName).replace(/\s+/g, "-");
    return baseName.replace(/[^a-zA-Z0-9._-]/g, "");
  }
}

export const storageService = new StorageService();
